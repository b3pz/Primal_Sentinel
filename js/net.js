'use strict';
/* ============================================================
   RETE — cooperativa online con codice stanza.
   WebRTC peer-to-peer tramite PeerJS (vendor/peerjs.min.js).
   L'host esegue la simulazione e invia le "view"; i client
   inviano solo i propri comandi. Nessun server di gioco:
   serve solo il servizio pubblico di "incontro" di PeerJS.
   Per usare un proprio server: index.html?peer=host:porta
   ============================================================ */
const NET_PREFIX = 'primal-sentinels-v1-';
const NET_VERSION = 2;

const Net = {
  role: null, peer: null, conns: new Map(), hostConn: null, code: '', status: '', error: '',
  myId: 0, remote: {}, lobby: [], lastView: null, prevView: null, viewAt: 0, prevAt: 0, onLobby: null, onStart: null,
  sendT: 0, lastBits: -1, rtt: 0, pingT: 0,

  options() {
    const q = new URLSearchParams(location.search);
    const custom = q.get('peer');
    const ice = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:global.stun.twilio.com:3478' }, { urls: 'stun:stun.cloudflare.com:3478' }];
    // phones on 4G/5G often sit behind a carrier NAT: a TURN relay fixes that.
    // ?turn=turn:host:3478&tu=user&tp=password  (remembered on this device)
    try {
      if (q.get('turn')) localStorage.setItem('primal-turn', JSON.stringify({ urls: q.get('turn'), username: q.get('tu') || '', credential: q.get('tp') || '' }));
      const t = JSON.parse(localStorage.getItem('primal-turn') || 'null');
      if (t && t.urls) ice.push(t);
    } catch (e) {}
    const base = { debug: 1, config: { iceServers: ice } };
    if (custom) {
      const [host, port] = custom.split(':');
      return { ...base, host, port: +(port || 9000), path: q.get('peerpath') || '/', secure: q.get('peersecure') === '1' };
    }
    // default public broker; force TLS so it also works when index.html is opened from disk (file://)
    return { ...base, host: '0.peerjs.com', port: 443, path: '/', secure: true };
  },
  available() { return typeof Peer !== 'undefined'; },

  makeCode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return s;
  },

  /* ---------- host ---------- */
  host(name, hero) {
    this.reset();
    this.role = 'host';
    this.code = this.makeCode();
    this.status = 'Creazione della stanza…';
    this.myId = 1;
    this.lobby = [{ id: 1, name: name || 'HOST', hero, ready: false, host: true }];
    this.peer = new Peer(NET_PREFIX + this.code, this.options());
    this.peer.on('open', () => { this.status = 'Stanza pronta. Condividi il codice.'; this.pushLobby(); });
    this.peer.on('error', (e) => {
      if (e.type === 'unavailable-id') { this.peer.destroy(); this.host(name, hero); return; }
      this.error = netErrorText(e); this.status = '';
    });
    this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (e) {} });
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        if (this.lobby.length >= 4 || Game.mode !== 'netlobby') { conn.send({ k: 'full', why: Game.mode !== 'netlobby' ? 'La partita è già iniziata.' : 'La stanza è piena (4 giocatori).' }); setTimeout(() => conn.close(), 300); return; }
        const id = Math.max(...this.lobby.map((p) => p.id)) + 1;
        conn._pid = id;
        this.conns.set(id, conn);
        this.remote[id] = { bits: 0, edge: 0 };
        conn.on('data', (m) => this.onHostData(conn, m));
        conn.on('close', () => this.dropClient(id));
        conn.on('error', () => this.dropClient(id));
      });
    });
  },
  onHostData(conn, m) {
    const id = conn._pid;
    conn._seen = performance.now();
    switch (m.k) {
      case 'hello': {
        if (m.ver !== NET_VERSION) { conn.send({ k: 'full', why: 'Versioni del gioco diverse: aggiornate entrambi.' }); return; }
        const used = this.lobby.map((p) => p.hero);
        let hero = m.hero ?? 0;
        if (used.includes(hero)) hero = [0, 1, 2, 3, 4].find((h) => !used.includes(h));
        this.lobby.push({ id, name: (m.name || 'OSPITE').slice(0, 12), hero, ready: false });
        conn.send({ k: 'welcome', id, code: this.code });
        Audio.sfx('confirm');
        this.pushLobby();
        break;
      }
      case 'pick': {
        const p = this.lobby.find((q) => q.id === id);
        if (p && HEROES[m.hero] && !this.lobby.some((q) => q.id !== id && q.hero === m.hero)) p.hero = m.hero;
        if (p) p.ready = !!m.ready;
        this.pushLobby();
        break;
      }
      case 'in': {
        const r = this.remote[id];
        if (r) { r.bits = m.b; r.edge |= m.e; }
        break;
      }
      case 'ping': conn.send({ k: 'pong', t: m.t }); break;
    }
  },
  /* WebRTC can take a long time to report a closed tab: use a heartbeat */
  watchdog() {
    const now = performance.now();
    if (this.role === 'host') {
      for (const [id, c] of this.conns) if (c._seen && now - c._seen > 6000) { try { c.close(); } catch (e) {} this.dropClient(id); }
    } else if (this.role === 'client' && Game.online === 'client' && this.viewAt && now - this.viewAt > 8000) {
      Game.connectionLost('Nessun segnale dall\'host da alcuni secondi.');
    }
  },
  dropClient(id) {
    if (!this.conns.has(id)) return;
    this.conns.delete(id);
    delete this.remote[id];
    this.lobby = this.lobby.filter((p) => p.id !== id);
    if (Game.mode === 'netlobby') this.pushLobby();
    else Game.playerLeft(id);
  },
  pushLobby() {
    this.broadcast({ k: 'lobby', players: this.lobby, code: this.code });
    if (this.onLobby) this.onLobby();
  },
  broadcast(m) {
    for (const c of this.conns.values()) {
      if (!c.open) continue;
      // don't pile up snapshots on slow links
      if (m.k === 'v' && c.dataChannel && c.dataChannel.bufferedAmount > 96000) continue;
      try { c.send(m); } catch (e) {}
    }
  },
  /* control for a remote player (consumes the edges) */
  controlFor(id) {
    const r = this.remote[id];
    if (!r) return EMPTY_CTRL;
    const c = unpackControl(r.bits, r.edge);
    r.edge = 0;
    return c;
  },

  /* ---------- client ---------- */
  join(code, name, hero) {
    this.reset();
    this.role = 'client';
    this.code = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.status = 'Connessione alla stanza ' + this.code + '…';
    this.peer = new Peer(undefined, this.options());
    const timeout = setTimeout(() => { if (!this.myId) { this.error = 'Nessuna risposta. Controlla il codice e che l\'host abbia la stanza aperta.'; this.status = ''; } }, 15000);
    this.peer.on('open', () => {
      const conn = this.peer.connect(NET_PREFIX + this.code, { reliable: true, serialization: 'json' });
      this.hostConn = conn;
      conn.on('open', () => { conn.send({ k: 'hello', name, hero, ver: NET_VERSION }); this.status = 'Connesso. In attesa dell\'host…'; });
      conn.on('data', (m) => this.onClientData(m));
      conn.on('close', () => { clearTimeout(timeout); if (Game.online === 'client') Game.connectionLost('L\'host ha chiuso la partita.'); });
      conn.on('error', () => {});
    });
    this.peer.on('error', (e) => { clearTimeout(timeout); this.error = netErrorText(e); this.status = ''; });
  },
  onClientData(m) {
    switch (m.k) {
      case 'welcome': this.myId = m.id; Audio.sfx('confirm'); break;
      case 'lobby': this.lobby = m.players; if (this.onLobby) this.onLobby(); break;
      case 'full': this.error = m.why; this.status = ''; break;
      case 'start': if (this.onStart) this.onStart(m); break;
      case 'v': {
        this.prevView = this.lastView; this.prevAt = this.viewAt;
        this.lastView = m.v; this.viewAt = performance.now();
        applyEvents(m.v.ev, m.v.m === 'stage');
        break;
      }
      case 'pong': this.rtt = performance.now() - m.t; break;
      case 'bye': Game.connectionLost(m.why || 'Partita terminata dall\'host.'); break;
    }
  },
  sendInput(c, dt) {
    if (this.role !== 'client' || !this.hostConn || !this.hostConn.open) return;
    const [bits, edge] = packControl(c);
    this.sendT -= dt;
    if (edge || bits !== this.lastBits || this.sendT <= 0) {
      this.hostConn.send({ k: 'in', b: bits, e: edge });
      this.lastBits = bits; this.sendT = 0.1;
    }
    this.pingT -= dt;
    if (this.pingT <= 0) { this.pingT = 2; this.hostConn.send({ k: 'ping', t: performance.now() }); }
  },
  sendPick(hero, ready) { if (this.hostConn && this.hostConn.open) this.hostConn.send({ k: 'pick', hero, ready }); },

  /* interpolated view for smooth motion between snapshots */
  view() {
    const v = this.lastView;
    if (!v || !this.prevView || v.m !== this.prevView.m || (v.m !== 'stage' && v.m !== 'giant')) return v;
    const span = this.viewAt - this.prevAt || 50;
    const k = clamp((performance.now() - this.viewAt) / span, 0, 1);
    if (v.m !== 'stage') return v;
    const prev = new Map(this.prevView.d.map((o) => [o.i, o]));
    const d = v.d.map((o) => {
      const p = prev.get(o.i);
      if (!p) return o;
      return { ...o, x: lerp(p.x, o.x, k), y: lerp(p.y, o.y, k), z: lerp(p.z || 0, o.z || 0, k) };
    });
    return { ...v, d, cam: lerp(this.prevView.cam, v.cam, k), ev: [] };
  },

  reset() {
    try { if (this.peer) this.peer.destroy(); } catch (e) {}
    this.peer = null; this.conns = new Map(); this.hostConn = null; this.role = null; this.myId = 0;
    this.remote = {}; this.lobby = []; this.error = ''; this.status = ''; this.lastView = null; this.prevView = null;
  },
  leave() {
    if (this.role === 'host') this.broadcast({ k: 'bye', why: 'L\'host ha lasciato la partita.' });
    setTimeout(() => this.reset(), 150);
  },
};

function netErrorText(e) {
  const t = e && e.type;
  if (t === 'peer-unavailable') return 'Stanza non trovata. Controlla il codice (5 caratteri).';
  if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return 'Impossibile raggiungere il servizio di collegamento. Serve una connessione a Internet.';
  if (t === 'browser-incompatible') return 'Questo browser non supporta WebRTC.';
  if (t === 'webrtc') return 'Il collegamento diretto è stato bloccato dalla rete (firewall o NAT). Prova un\'altra rete.';
  return 'Errore di rete: ' + (t || e);
}
