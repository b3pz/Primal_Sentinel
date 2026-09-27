'use strict';
/* ============================================================
   MAIN — stati del gioco, menu, lobby locale/online, flusso
   dei capitoli, ciclo a passo fisso.
   ============================================================ */
const screenEl = document.querySelector('#screen');
const SAVE_KEY = 'primal-sentinels-progress';

const UI = {
  typing() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); },
  show(html, cls = '') {
    screenEl.className = cls;
    screenEl.innerHTML = html;
    const f = screenEl.querySelector('[autofocus]') || screenEl.querySelector('button');
    if (f) f.focus();
  },
  hide() { screenEl.className = 'hidden'; screenEl.innerHTML = ''; },
  on(sel, fn) { const el = screenEl.querySelector(sel); if (el) el.onclick = () => { Audio.unlock(); Audio.sfx('confirm'); fn(); }; },
  /* gamepad / keyboard navigation for DOM menus */
  nav() {
    if (screenEl.className.includes('hidden')) return;
    const btns = [...screenEl.querySelectorAll('button:not([disabled]), input')];
    if (!btns.length) return;
    const i = btns.indexOf(document.activeElement);
    let move = 0, press = false;
    for (const p of Input.pads()) {
      const c = Input.read('pad' + p.index);
      const prev = Input.padPrev[p.index] || [];
      const b = p.buttons.map((x) => x.pressed);
      const ax = p.axes[1] || 0, axh = p.axes[0] || 0;
      const edge = (k) => b[k] && !prev[k];
      if (edge(13) || edge(15)) move = 1;
      if (edge(12) || edge(14)) move = -1;
      if (!this._axisLatch && (ax > 0.6 || axh > 0.6)) { move = 1; this._axisLatch = true; }
      if (!this._axisLatch && (ax < -0.6 || axh < -0.6)) { move = -1; this._axisLatch = true; }
      if (Math.abs(ax) < 0.3 && Math.abs(axh) < 0.3) this._axisLatch = false;
      if (edge(0) || edge(2)) press = true;
      if (edge(1) && Game.back) Game.back();
    }
    if (!this.typing()) {
      if (Input.keyEdge.ArrowDown || Input.keyEdge.ArrowRight || Input.keyEdge.KeyS) move = 1;
      if (Input.keyEdge.ArrowUp || Input.keyEdge.ArrowLeft || Input.keyEdge.KeyW) move = -1;
      if (Input.keyEdge.Escape && Game.back) Game.back();
    }
    if (move) { btns[(i + move + btns.length) % btns.length].focus(); Audio.sfx('select'); }
    if (press && document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.click();
  },
};

const Game = {
  mode: 'loading', players: [], S: null, G: null, levelIdx: 0, startLevel: 0, dlg: null, introT: 0, endT: 0,
  online: null, view: null, showTags: false, local: { twoKeyboards: false }, lobbySlots: [], edgeBuf: {}, heldBuf: {},
  pendingEv: [], sendT: 0, back: null, afterDialog: null, overReason: '',

  /* ---------------- menus ---------------- */
  menu() {
    this.mode = 'menu';
    this.back = null;
    if (this.online) { Net.leave(); this.online = null; }
    this.local.twoKeyboards = false;
    this.attract = false; this.capture = null;
    Audio.playSong(8, 'sigla');
    const prog = this.progress();
    UI.show(`
      <img class="logo" src="assets/ui/logo.png" alt="Primal Sentinels · Il cuore dei titani">
      <nav class="grid2 arcade">
        <button class="primary" id="play" autofocus>GIOCA · STORIA · 1-4 GIOCATORI</button>
        <button id="online">COOPERATIVA ONLINE</button>
        <button id="extras">MODALITÀ EXTRA</button>
        <button id="chapters">CAPITOLI${prog > 0 ? ` · ${prog + 1}/8` : ''}</button>
        <button id="diff">DIFFICOLTÀ: ${DIFF.name}</button>
        <button id="scores">CLASSIFICHE</button>
        <button id="gallery">GALLERIA</button>
        <button id="howto">COME SI GIOCA</button>
        <button id="options">OPZIONI</button>
      </nav>
      <div class="footer">IDEATO E SVILUPPATO DA b3pZ · V1.6.2</div>`, 'menu');
    UI.on('#play', () => { this.modeKind = 'campaign'; this.startLevel = 0; this.lobby(); });
    UI.on('#online', () => this.onlineMenu());
    UI.on('#extras', () => this.extras());
    UI.on('#chapters', () => this.chapters());
    UI.on('#scores', () => this.showScores(0, () => this.menu()));
    UI.on('#gallery', () => this.gallery());
    UI.on('#howto', () => this.howto(() => this.menu()));
    UI.on('#options', () => this.options());
    UI.on('#diff', () => {
      const keys = Object.keys(DIFFS); const k = keys[(keys.indexOf(this.diffKey()) + 1) % keys.length];
      DIFF = DIFFS[k]; try { localStorage.setItem('primal-diff', k); } catch (e) {}
      this.menu(); const b = screenEl.querySelector('#diff'); if (b) b.focus();
    });
    { const b = screenEl.querySelector('#diff'); if (b) b.title = DIFF.desc; }
  },
  /* title screen: logo + PREMI START, attract mode after a while */
  title() {
    this.mode = 'title';
    this.back = null;
    this.titleT = 0;
    UI.hide();
    Audio.playSong(8);
  },
  tickTitle(dt) {
    this.titleT += dt;
    const any = Object.keys(Input.keyEdge).length > 0 || Input.pads().some((p) => Object.values(Input.read('pad' + p.index).pressed).some(Boolean));
    if (any && this.titleT > 0.5) { Audio.unlock(); Audio.sfx('team'); this.menu(); return; }
    if (this.titleT > 30) this.nextAttract();
  },
  /* animated tutorial; `then` is called when the player leaves it */
  howto(then, footer) {
    this.mode = 'howto';
    this.howT = 0; this.howPg = 0; this.howThen = then; this.howFooter = footer;
    const dev = (this.players[0] && this.players[0].device) || this.lastDevice || 'kb';
    this.howScheme = dev.startsWith('pad') ? 'pad' : this.local.twoKeyboards ? 'kb2' : 'kb';
    UI.hide();
    FX.team = null;
  },
  menuEdges() {
    const K = Input.keyEdge;
    const e = { l: K.ArrowLeft || K.KeyA, r: K.ArrowRight || K.KeyD, u: K.ArrowUp || K.KeyW, d: K.ArrowDown || K.KeyS, ok: K.Enter || K.KeyJ || K.KeyF || K.Space || K.Escape, any: false };
    for (const p of Input.pads()) {
      const b = p.buttons.map((x) => x.pressed), prev = Input.padPrev[p.index] || [];
      const ed = (i) => b[i] && !prev[i];
      if (ed(14)) e.l = true; if (ed(15)) e.r = true; if (ed(12)) e.u = true; if (ed(13)) e.d = true;
      if (ed(0) || ed(2) || ed(9) || ed(1)) e.ok = true;
    }
    return e;
  },
  tickHowto(dt, ctrls) {
    this.howT += dt;
    const e = this.menuEdges();
    const remoteOk = ctrls && Object.values(ctrls).some((c) => c.pressed.punch || c.pressed.start);
    const n = HOWTO.length;
    if (e.l) { this.howPg = (this.howPg + n - 1) % n; this.howT = 0; FX.team = null; Audio.sfx('select'); }
    if (e.r || this.howT > HOWTO_PAGE * 1.02) { this.howPg = (this.howPg + 1) % n; this.howT = 0; FX.team = null; if (e.r) Audio.sfx('select'); }
    if (e.u || e.d) { const i = SCHEMES.indexOf(this.howScheme); this.howScheme = SCHEMES[(i + (e.d ? 1 : SCHEMES.length - 1)) % SCHEMES.length]; Audio.sfx('select'); }
    if ((e.ok || remoteOk) && this.howT > 0.3) {
      FX.team = null;
      try { localStorage.setItem('primal-tutorial-seen', '1'); } catch (err) {}
      Audio.sfx('confirm');
      const then = this.howThen; this.howThen = null; then && then();
    }
  },
  tutorialSeen() { try { return !!localStorage.getItem('primal-tutorial-seen'); } catch (e) { return true; } },
  playCine(id, then) {
    this.mode = 'cine';
    this.cine = { id, t: 0, prev: 0 };
    this.afterCine = then;
    UI.hide();
  },
  diffKey() { return Object.keys(DIFFS).find((k) => DIFFS[k] === DIFF) || 'normal'; },
  sigilsSaved() { try { return JSON.parse(localStorage.getItem('primal-sigils') || '{}'); } catch (e) { return {}; } },
  saveSigils(lvl, list) {
    try { const all = this.sigilsSaved(); all[lvl] = [...new Set([...(all[lvl] || []), ...list])]; localStorage.setItem('primal-sigils', JSON.stringify(all)); } catch (e) {}
  },
  progress() { try { return Math.min(7, +(localStorage.getItem(SAVE_KEY) || 0)); } catch (e) { return 0; } },
  saveProgress(i) { try { if (i > this.progress()) localStorage.setItem(SAVE_KEY, String(Math.min(7, i))); } catch (e) {} },

  chapters() {
    this.mode = 'menu';
    this.back = () => this.menu();
    const prog = this.diffKey() === 'arcade' ? 0 : this.progress();
    const sg = this.sigilsSaved();
    const tot = Object.values(sg).reduce((a, l) => a + l.length, 0);
    UI.show(`<span class="eyebrow">CAPITOLI · SIGILLI DEI TITANI ${tot}/24</span><h2>${this.diffKey() === 'arcade' ? 'In modalità Arcade si parte dal capitolo 1' : 'Scegli da dove ripartire'}</h2>
      <div class="chapters">${LEVELS.map((L, i) => `<button class="chap" data-i="${i}" ${i > prog ? 'disabled' : ''}><b>${L.n}</b><span>${i > prog ? 'BLOCCATO' : L.title}</span><small>${i > prog ? (this.diffKey() === 'arcade' ? 'Solo dal capitolo 1' : 'Completa il capitolo precedente') : L.place + ' · ' + '★'.repeat((sg[i] || []).length) + '☆'.repeat(3 - (sg[i] || []).length)}</small></button>`).join('')}</div>
      <nav><button id="back">INDIETRO</button></nav>`);
    screenEl.querySelectorAll('.chap').forEach((b) => b.onclick = () => { Audio.sfx('confirm'); this.modeKind = 'campaign'; this.startLevel = +b.dataset.i; this.lobby(); });
    UI.on('#back', () => this.menu());
  },

  help() {
    this.mode = 'menu';
    this.back = () => this.menu();
    UI.show(`<span class="eyebrow">ADDESTRAMENTO</span><h2>Comandi</h2>
      <div class="helpgrid">
        <div><h3>Un giocatore (tastiera)</h3>
        <p><kbd>WASD</kbd>/<kbd>frecce</kbd> muovi · doppio tocco: corsa<br><kbd>J</kbd> pugno (3 di fila = combo) · <kbd>K</kbd> calcio<br><kbd>Spazio</kbd> salto (+ pugno/calcio in aria)<br><kbd>L</kbd> speciale (40 energia, altrimenti costa vita)<br><kbd>Shift</kbd> schivata · <kbd>I</kbd> colpo di squadra<br><kbd>Esc</kbd> pausa · <kbd>M</kbd> audio</p></div>
        <div><h3>Due giocatori sulla tastiera</h3>
        <p><b>1P</b>: <kbd>WASD</kbd> · <kbd>F</kbd> pugno · <kbd>G</kbd> calcio · <kbd>Spazio</kbd> salto · <kbd>R</kbd> speciale · <kbd>Shift sx</kbd> schivata · <kbd>T</kbd> squadra<br>
        <b>2P</b>: <kbd>frecce</kbd> · <kbd>K</kbd>/<kbd>Num1</kbd> pugno · <kbd>L</kbd>/<kbd>Num2</kbd> calcio · <kbd>I</kbd>/<kbd>Num0</kbd> salto · <kbd>O</kbd>/<kbd>Num3</kbd> speciale · <kbd>Shift dx</kbd> schivata · <kbd>P</kbd> squadra</p></div>
        <div><h3>Controller (fino a 4)</h3>
        <p>Stick/croce muovi · <b>X</b> pugno · <b>Y</b> calcio · <b>A</b> salto · <b>B</b> speciale · <b>RB/RT</b> schivata · <b>LB</b> squadra · <b>Start</b> pausa</p></div>
        <div><h3>Trucchi da sala giochi</h3>
        <p>Cammina contro un nemico stordito per <b>afferrarlo</b>: pugno = ginocchiate, calcio = lancio contro gli altri.<br>Premi pugno sopra un'arma per raccoglierla. I fusti rossi esplodono.<br>Nei duelli giganti tieni <b>schivata</b> per parare e sbilancia il mostro, poi <b>speciale</b> per l'arma finale.</p></div>
      </div>
      <nav><button id="back" autofocus>INDIETRO</button></nav>`);
    UI.on('#back', () => this.menu());
  },

  /* ---------------- local lobby (canvas) ---------------- */
  lobby() {
    this.mode = 'lobby';
    this.back = null;
    UI.hide();
    this.local.twoKeyboards = false;
    this.lobbySlots = [];
    this.lobbyT = 0;
    // the device used to open the lobby joins automatically
    const dev = this.lastDevice || 'kb';
    this.joinSlot(dev);
  },
  joinSlot(dev) {
    if (this.lobbySlots.length >= 4 || this.lobbySlots.some((s) => s.dev === dev)) return;
    const used = this.lobbySlots.map((s) => s.hero);
    const hero = [0, 1, 2, 3, 4].find((h) => !used.includes(h));
    this.lobbySlots.push({ dev, hero, ready: false, t: 0, skin: 0 });
    Audio.sfx('confirm');
  },
  tickLobby(dt) {
    this.lobbyT += dt;
    const slots = this.lobbySlots;
    // joins
    const K = Input.keyEdge;
    if (!slots.some((s) => s.dev.startsWith('kb')) && (K.KeyF || K.KeyJ || K.Space || K.Enter)) this.joinSlot('kb');
    else if (slots.some((s) => s.dev.startsWith('kb')) && !slots.some((s) => s.dev === 'kbB') && (K.KeyK || K.Numpad1)) {
      const a = slots.find((s) => s.dev.startsWith('kb')); a.dev = 'kbA';
      this.local.twoKeyboards = true; this.joinSlot('kbB');
    }
    for (const p of Input.pads()) {
      const dev = 'pad' + p.index;
      const c = Input.read(dev);
      if (!slots.some((s) => s.dev === dev) && (c.pressed.jump || c.pressed.punch || c.pressed.start)) this.joinSlot(dev);
    }
    // per-slot controls
    for (const s of slots) {
      s.t += dt;
      if (s.t < 0.2) continue;
      const c = this.lobbyControl(s.dev);
      if (!s.ready) {
        let dir = 0;
        if (c.pressed.l) dir = -1; if (c.pressed.r) dir = 1;
        if (dir) {
          let h = s.hero; const n = this.heroCount();
          for (let k = 0; k < n; k++) { h = (h + dir + n) % n; if (!slots.some((o) => o !== s && o.ready && o.hero === h)) break; }
          s.hero = h; Audio.sfx('select');
        }
        // alternate costumes (unlocked with the sigils / by finishing the story)
        if (c.pressed.u || c.pressed.d) {
          const sk = this.skinsUnlocked();
          if (sk.length > 1) { s.skin = sk[(sk.indexOf(s.skin || 0) + (c.pressed.u ? 1 : sk.length - 1)) % sk.length]; Audio.sfx('select'); }
        }
        if (c.pressed.punch || c.pressed.jump || c.pressed.start) {
          if (slots.some((o) => o !== s && o.ready && o.hero === s.hero)) Audio.sfx('hurt');
          else { s.ready = true; Audio.sfx('confirm'); }
        }
        if (c.pressed.shoot || c.pressed.back) {
          if (slots.length === 1) { this.menu(); return; }
          this.lobbySlots = slots.filter((o) => o !== s);
          if (s.dev === 'kbB') { this.local.twoKeyboards = false; const a = this.lobbySlots.find((o) => o.dev === 'kbA'); if (a) a.dev = 'kb'; }
          Audio.sfx('select');
          return;
        }
      } else if (c.pressed.shoot || c.pressed.back) { s.ready = false; Audio.sfx('select'); }
    }
    if (K.Escape && !slots.some((s) => s.ready)) { this.menu(); return; }
    if (slots.length && slots.every((s) => s.ready)) {
      this.readyT = (this.readyT || 0) + dt;
      if (this.readyT > 0.9) { this.readyT = 0; this.startLocalGame(); }
    } else this.readyT = 0;
  },
  lobbyControl(dev) {
    const c = Input.read(dev === 'kb' ? 'kb' : dev);
    // edge-detect directions for menus
    const prev = this._lobbyPrev || (this._lobbyPrev = {});
    const p = prev[dev] || {};
    const out = { pressed: { ...c.pressed, l: c.l && !p.l, r: c.r && !p.r, u: c.u && !p.u, d: c.d && !p.d, back: false } };
    if (dev.startsWith('kb')) {
      const K = Input.keyEdge, two = this.local.twoKeyboards;
      out.pressed.back = !!K.Backspace;
      if (dev !== 'kbB' && (K.KeyW || (!two && K.ArrowUp))) out.pressed.u = true;
      if (dev !== 'kbB' && (K.KeyS || (!two && K.ArrowDown))) out.pressed.d = true;
      if (dev === 'kbB' && K.ArrowUp) out.pressed.u = true;
      if (dev === 'kbB' && K.ArrowDown) out.pressed.d = true;
      // quick taps can start and end inside one frame: also look at key edges
      if (dev !== 'kbB' && (K.KeyA || (!two && K.ArrowLeft))) out.pressed.l = true;
      if (dev !== 'kbB' && (K.KeyD || (!two && K.ArrowRight))) out.pressed.r = true;
      if (dev === 'kbB' && K.ArrowLeft) out.pressed.l = true;
      if (dev === 'kbB' && K.ArrowRight) out.pressed.r = true;
    }
    prev[dev] = { l: c.l, r: c.r, u: c.u, d: c.d };
    return out;
  },
  startLocalGame() {
    this.online = null;
    this.players = this.lobbySlots.map((s, i) => ({ id: i + 1, device: s.dev, hero: s.hero, skin: s.skin || 0, name: `${i + 1}P`, lives: 3, score: 0 }));
    this.showTags = this.players.length > 1;
    this.beginCampaign();
  },

  drawLobby(online = false) {
    coverImage('story_cores', 1.05, 0.5, 0.5);
    g.fillStyle = 'rgba(3,8,16,.72)'; g.fillRect(0, 0, W, H);
    txt(online ? 'COOPERATIVA ONLINE' : 'SCEGLI IL TUO SENTINEL', W / 2, 70, 38, '#f5dcad', 'center', 900);
    if (this.modeKind !== 'campaign') ptxt(MODE_NAMES[this.modeKind] + (this.modeKind === 'timeattack' ? ` · CAPITOLO ${this.taLevel + 1}` : ''), W / 2, 104, 12, '#9fe8ff', 'center');
    const slots = online ? Net.lobby.map((p) => ({ hero: p.hero, ready: p.ready, name: p.name, me: p.id === Net.myId, host: p.host })) : this.lobbySlots;
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 305, y = 120, w = 285, h = 470;
      const s = slots[i];
      g.fillStyle = s ? 'rgba(10,22,36,.92)' : 'rgba(10,22,36,.5)'; g.fillRect(x, y, w, h);
      if (!s) {
        g.strokeStyle = '#2a4052'; g.setLineDash([8, 6]); g.strokeRect(x + 1, y + 1, w - 2, h - 2); g.setLineDash([]);
        txt(`${i + 1}P`, x + w / 2, y + 180, 40, '#2e4a60', 'center', 900);
        if (!online) {
          const lines = ['PER UNIRTI PREMI', 'Controller: A o X', !this.local.twoKeyboards && slots.some((q) => q.dev && q.dev.startsWith('kb')) ? 'Tastiera 2: K o Num1' : !slots.some((q) => q.dev && q.dev.startsWith('kb')) ? 'Tastiera: F, J o Spazio' : ''];
          lines.forEach((l, k) => txt(l, x + w / 2, y + 250 + k * 28, k ? 15 : 13, k ? '#9fb4c8' : '#6f8aa2', 'center', 800));
        } else txt('IN ATTESA…', x + w / 2, y + 250, 15, '#6f8aa2', 'center', 800);
        continue;
      }
      const hero = HEROES[s.hero];
      g.fillStyle = hero.color; g.fillRect(x, y, w, 5);
      const grd = g.createRadialGradient(x + w / 2, y + 250, 10, x + w / 2, y + 250, 200);
      grd.addColorStop(0, hero.color + '55'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(x, y, w, h);
      const devName = online ? (s.me ? 'TU' : s.name) + (s.host ? ' · HOST' : '') : s.dev === 'kb' ? 'TASTIERA' : s.dev === 'kbA' ? 'TASTIERA 1 (WASD)' : s.dev === 'kbB' ? 'TASTIERA 2 (FRECCE)' : 'CONTROLLER ' + (+s.dev.slice(3) + 1);
      txt(`${i + 1}P · ${devName}`, x + 16, y + 34, 14, '#c8d6e4', 'left', 800);
      const f = Math.floor(this.lobbyT * 3) % 4 === 3 && !s.ready ? 4 : s.ready ? 5 : 0;
      drawShadow(x + w / 2, y + 330, 40);
      heroSpr(s.hero, f, x + w / 2, y + 330, { scale: 1.2, face: 1, skin: s.skin || 0 });
      if (!s.ready && (!online || s.me)) { txt('◀', x + 22, y + 230, 26, '#ffcf7a', 'center', 900); txt('▶', x + w - 22, y + 230, 26, '#ffcf7a', 'center', 900); }
      txt(hero.name, x + w / 2, y + 372, 30, hero.color, 'center', 900);
      txt(`${hero.role.toUpperCase()} · ${hero.civil}`, x + w / 2, y + 396, 13, '#c8d6e4', 'center', 800);
      txt(hero.special, x + w / 2, y + 420, 12, '#ffcf7a', 'center', 800);
      if (!online && this.skinsUnlocked().length > 1 && !s.ready) ptxt(`▲▼ COSTUME: ${SKINS[s.skin || 0].name}`, x + w / 2, y + 60, 8, '#ffd35a', 'center');
      else if (s.skin) ptxt(`COSTUME ${SKINS[s.skin].name}`, x + w / 2, y + 60, 8, '#ffd35a', 'center');
      const taken = !s.ready && slots.some((o) => o !== s && o.ready && o.hero === s.hero);
      if (s.ready) { g.fillStyle = hero.color; g.fillRect(x + 20, y + 436, w - 40, 26); txt('PRONTO!', x + w / 2, y + 455, 16, '#0b1118', 'center', 900); }
      else txt(taken ? 'GIÀ SCELTO' : online && !s.me ? 'STA SCEGLIENDO…' : 'ATTACCO: PRONTO · SPARO: ESCI', x + w / 2, y + 455, 12, taken ? '#ff8a7a' : '#9fb4c8', 'center', 800);
    }
    if (online) {
      g.fillStyle = 'rgba(4,10,20,.85)'; g.fillRect(40, 610, W - 80, 80);
      if (Net.error) txt(Net.error, W / 2, 658, 18, '#ff9a8a', 'center', 800);
      else if (Net.role === 'host') {
        txt('CODICE STANZA', 80, 645, 14, '#9fb4c8', 'left', 800);
        txt(Net.code || '·····', 80, 680, 34, '#ffcf7a', 'left', 900);
        txt(Net.status, 330, 650, 15, '#c8d6e4', 'left', 700);
        const allReady = Net.lobby.length > 0 && Net.lobby.every((p) => p.ready);
        txt(allReady ? (Net.lobby.length > 1 ? 'TUTTI PRONTI · PREMI START / INVIO PER PARTIRE' : 'SEI SOLO: PUOI PARTIRE ANCHE COSÌ (START / INVIO)') : 'SCEGLI L\'EROE E PREMI PUGNO QUANDO SEI PRONTO', 330, 678, 15, allReady ? '#7bf0b1' : '#9fb4c8', 'left', 800);
      } else {
        txt(Net.status || (Net.myId ? 'Connesso alla stanza ' + Net.code : ''), W / 2, 645, 16, '#c8d6e4', 'center', 700);
        txt('Scegli l\'eroe con ◀ ▶ e premi PUGNO. L\'host avvierà la partita.', W / 2, 675, 15, '#9fb4c8', 'center', 700);
      }
      txt('ESC: ESCI DALLA STANZA', W - 60, 700, 11, '#6f8aa2', 'right', 700);
    } else {
      txt('◀ ▶ SCEGLI · J / X: PRONTO · K / Y: ANNULLA · ESC: MENU', W / 2, 640, 15, '#9fb4c8', 'center', 800);
      txt('Quando tutti sono pronti la partita inizia. In più giocatori i nemici sono più numerosi.', W / 2, 668, 13, '#6f8aa2', 'center', 700);
    }
  },

  /* ---------------- online ---------------- */
  onlineMenu() {
    this.mode = 'menu';
    this.back = () => this.menu();
    const avail = Net.available();
    let name = '';
    try { name = localStorage.getItem('primal-name') || ''; } catch (e) {}
    UI.show(`<span class="eyebrow">COOPERATIVA ONLINE</span><h2>Gioca con gli amici da un altro PC</h2>
      <p>Uno crea la stanza e comunica il <b>codice di 5 caratteri</b>; gli altri lo inseriscono. Fino a 4 giocatori. Il collegamento è diretto tra i vostri browser (WebRTC): serve Internet solo per "presentarvi".</p>
      ${avail ? '' : '<p class="warn">La libreria di rete non è stata caricata: verifica che la cartella <b>vendor</b> sia accanto a index.html.</p>'}
      <label class="field">IL TUO NOME<input id="name" maxlength="12" value="${name.replace(/"/g, '')}" placeholder="Es. Marco"></label>
      <nav><button class="primary" id="host" ${avail ? '' : 'disabled'}>CREA UNA STANZA</button><button id="omode">MODALITÀ: ${MODE_NAMES[this.modeKind === 'timeattack' ? 'campaign' : this.modeKind]}</button></nav>
      <label class="field">CODICE STANZA<input id="code" maxlength="5" placeholder="ES. K7QX2" style="text-transform:uppercase"></label>
      <nav><button id="join" ${avail ? '' : 'disabled'}>ENTRA NELLA STANZA</button><button id="back">INDIETRO</button></nav>`);
    const getName = () => { const n = (screenEl.querySelector('#name').value || '').trim().slice(0, 12) || 'SENTINEL'; try { localStorage.setItem('primal-name', n); } catch (e) {} return n.toUpperCase(); };
    if (this.modeKind === 'timeattack') this.modeKind = 'campaign';
    UI.on('#omode', () => { const k = ['campaign', 'bossrush', 'survival']; this.modeKind = k[(k.indexOf(this.modeKind) + 1) % k.length]; const nm = screenEl.querySelector('#name').value; this.onlineMenu(); screenEl.querySelector('#name').value = nm; screenEl.querySelector('#omode').focus(); });
    UI.on('#host', () => { const n = getName(); this.netLobby(); Net.host(n, 0); });
    UI.on('#join', () => {
      const code = (screenEl.querySelector('#code').value || '').trim();
      if (code.length < 5) { screenEl.querySelector('#code').focus(); return; }
      const n = getName(); this.netLobby(); Net.join(code, n, 1);
    });
    UI.on('#back', () => this.menu());
  },
  netLobby() {
    this.mode = 'netlobby';
    this.back = null;
    UI.hide();
    this.lobbyT = 0;
    Net.onStart = (m) => this.clientStart(m);
    Net.onLobby = null;
  },
  tickNetLobby(dt) {
    this.lobbyT += dt;
    const me = Net.lobby.find((p) => p.id === Net.myId);
    const dev = this.lastDevice || 'kb';
    const c = this.lobbyControl(dev.startsWith('kb') ? 'kb' : dev);
    if (Input.keyEdge.Escape) { Net.leave(); this.online = null; this.menu(); return; }
    if (!me) return;
    if (!me.ready) {
      let dir = 0; if (c.pressed.l) dir = -1; if (c.pressed.r) dir = 1;
      if (dir) {
        let h = me.hero;
        const n = this.heroCount();
        for (let k = 0; k < n; k++) { h = (h + dir + n) % n; if (!Net.lobby.some((o) => o !== me && o.hero === h)) break; }
        me.hero = h; Audio.sfx('select');
        if (Net.role === 'client') Net.sendPick(h, false); else Net.pushLobby();
      }
      if (c.pressed.punch || c.pressed.jump) { me.ready = true; Audio.sfx('confirm'); if (Net.role === 'client') Net.sendPick(me.hero, true); else Net.pushLobby(); }
    } else if (c.pressed.shoot) { me.ready = false; if (Net.role === 'client') Net.sendPick(me.hero, false); else Net.pushLobby(); }
    if (Net.role === 'host' && Net.lobby.every((p) => p.ready) && (Input.keyEdge.Enter || c.pressed.start || Input.keyEdge.NumpadEnter)) this.hostStart();
  },
  hostStart() {
    this.online = 'host';
    this.players = Net.lobby.map((p) => ({ id: p.id, device: p.id === Net.myId ? (this.lastDevice || 'kb') : 'remote', hero: p.hero, name: p.name, lives: 3, score: 0 }));
    this.showTags = true;
    Net.broadcast({ k: 'start' });
    this.beginCampaign();
  },
  clientStart() {
    this.online = 'client';
    this.mode = 'client';
    this.showTags = true;
    UI.hide();
  },
  playerLeft(id) {
    const p = this.players.find((q) => q.id === id);
    if (!p) return;
    p.device = 'gone';
    if (this.S) { const sp = this.S.players.find((q) => q.id === id); if (sp) { sp.out = true; sp.lives = 0; sp.gone = true; } }
    this.pendingEv.push({ t: 'txt', x: 640, y: 200, s: `${p.name} HA LASCIATO LA PARTITA`, c: '#ffb0a0', size: 22, fixed: 1 });
  },
  connectionLost(why) {
    if (this.mode === 'menu') return;
    this.online = null;
    Net.reset();
    this.mode = 'menu';
    this.back = () => this.menu();
    UI.show(`<span class="eyebrow">COLLEGAMENTO INTERROTTO</span><h2>${why}</h2><nav><button class="primary" id="m" autofocus>TORNA AL MENU</button></nav>`, 'center');
    UI.on('#m', () => this.menu());
  },

  /* ---------------- campaign flow ---------------- */
  beginCampaign() {
    UI.hide();
    if (this.modeKind && this.modeKind !== 'campaign') { this.beginMode(); return; }
    for (const p of this.players) { p.score = 0; p.lives = 3; }
    this.credits = DIFF.credits;
    if (this.diffKey() === 'arcade') this.startLevel = 0;
    this.levelIdx = this.startLevel;
    if (this.startLevel === 0) { this.mode = 'intro'; this.introT = 0; this.prevIntroT = 0; Audio.playSong(8); }
    else this.chapterStart(this.startLevel);
  },
  chapterStart(idx, checkpoint = 0) {
    this.levelIdx = idx;
    const L = LEVELS[idx];
    Audio.playSong(L.music);
    if (checkpoint) { this.enterStage(idx, checkpoint); return; }
    this.dialog([{ card: true }, ...L.intro], () => this.enterStage(idx, 0));
  },
  simPlayers(keepLives) { return this.players.filter((p) => p.device !== 'gone').map((p) => ({ id: p.id, hero: p.hero, skin: p.skin || 0, name: p.name, lives: keepLives ? p.lives : Math.max(3, p.lives), score: p.score })); },
  enterStage(idx, cp) {
    this.S = newStage(idx, this.simPlayers(), cp);
    this.S.credits = this.credits;
    this.S.summonOK = this.sigilTotal() >= 3;
    { const z = LEVELS[idx].zones[cp]; if (cp && z && z.ride === 'end') startRide(this.S); }
    if (!cp) this.chapterCont = 0;
    this.G = null;
    this.mode = 'stage';
    FX.parts = [];
  },
  dialog(lines, then) {
    this.mode = 'dlg';
    this.dlg = { lines, i: 0, t: 0 };
    this.afterDialog = then;
  },
  carryScores(list) {
    for (const sp of list) { const p = this.players.find((q) => q.id === sp.id); if (p) { p.score = sp.score; p.lives = Math.max(sp.lives, 0); } }
  },
  stageResult(r) {
    const L = LEVELS[this.levelIdx];
    if (this.modeKind !== 'campaign' && this.modeStageResult(r)) return;
    if (r === 'ride') {
      // chapter 3: the Tiranno rosso wakes up and the heroes ride it
      this.playCine('awake', () => { this.mode = 'stage'; startRide(this.S); Audio.playSong(L.music); });
      return;
    }
    this.carryScores(this.S.players);
    if (r === 'bonus') { Audio.playSong(8); this.afterClear(); return; }
    const S = this.S;
    this.stats = { lvl: this.levelIdx, time: S.t + (this.stageTimeBefore || 0), saved: S.saved, sigils: S.sigils.slice(), dmg: S.dmgTaken, cont: (this.chapterCont || 0) + S.contUsed,
      players: S.players.map((p) => ({ h: p.hero, n: p.name, sc: p.score, ko: p.kos, cb: p.maxCombo })) };
    if (r === 'giant') {
      const duel = () => { this.G = newGiant(this.levelIdx, this.simPlayers()); this.mode = 'giant'; FX.parts = []; Audio.playSong(7, 'titani'); };
      const mc = MID_CINE[this.levelIdx];
      this.dialog(L.mid, () => (mc !== undefined && mc !== null ? this.playCine(mc, duel) : duel()));
      return;
    }
    this.levelClear();
  },
  levelClear() {
    this.saveProgress(this.levelIdx + 1);
    const before = this.sigilTotal();
    if (this.stats) this.saveSigils(this.levelIdx, this.stats.sigils);
    const after = this.sigilTotal();
    if (this.stats) {
      this.stats.unlock = [];
      if (before < 3 && after >= 3) this.stats.unlock.push('EVOCAZIONE DEL TITANO');
      if (before < 12 && after >= 12) this.stats.unlock.push('COSTUME OMBRA');
    }
    Audio.playSong(8);
    this.summary(() => this.afterClear());
  },
  afterClear() {
    if (BONUS_AFTER.includes(this.levelIdx) && !this.bonusDone) {
      // bonus stage: destroy Vespera's capsule in 30 seconds
      this.bonusDone = true;
      this.S = newStage(this.levelIdx, this.simPlayers(), 0, bonusLevel(this.levelIdx));
      this.S.credits = this.credits; this.mode = 'stage'; FX.parts = []; Audio.playSong(3);
      return;
    }
    this.bonusDone = false;
    // an animated cinematic tells what happens between this chapter and the next
    this.playCine(this.levelIdx, () => {
      if (this.levelIdx >= LEVELS.length - 1) { this.mode = 'ending'; this.endT = 0; this.unlockMsg = !this.unlocks().story; this.setUnlock('story'); Audio.playSong(8, 'finale'); }
      else this.chapterStart(this.levelIdx + 1);
    });
  },
  /* all players down: CONTINUA? 10..0 if there are credits, otherwise GAME OVER */
  gameOver(kind) {
    this.overKind = kind;
    this.back = null;
    UI.hide();
    if (this.credits > 0) { this.mode = 'cont'; this.contT = 10.99; Audio.sfx('siren'); }
    else this.finalOver();
  },
  finalOver() {
    this.mode = 'final'; this.finalT = 0; Audio.stopSong(); Audio.sfx('ko');
    this.runResult = { kind: this.modeKind || 'campaign', win: false };
  },
  tickCont(dt, ctrls) {
    const before = Math.floor(this.contT);
    this.contT -= dt;
    if (Math.floor(this.contT) !== before && this.contT > 0) Audio.sfx('select');
    if (this.anyPress(ctrls, 'start', 'punch') || Input.keyEdge.Enter) {
      if (this.contT < 10.5) this.contT = Math.floor(this.contT);   // pressing also speeds up, like arcades
      this.credits--; this.chapterCont = (this.chapterCont || 0) + 1;
      for (const p of this.players) p.lives = 3;
      Audio.sfx('confirm');
      if (this.overKind === 'giant') { this.G = newGiant(this.levelIdx, this.simPlayers()); this.mode = 'giant'; }
      else { const cp = this.S.checkpoint, cont = this.chapterCont; this.enterStage(this.levelIdx, cp); this.chapterCont = cont; }
      return;
    }
    if (this.contT <= 0) this.finalOver();
  },
  tickFinal(dt, ctrls) {
    this.finalT += dt;
    if (this.finalT > 7 || (this.finalT > 2 && (this.anyPress(ctrls, 'start', 'punch') || Input.keyEdge.Enter))) this.afterRun();
  },
  /* end of chapter summary with a rank */
  summary(then) {
    this.mode = 'summary'; this.sumT = 0; this.afterSum = then;
    const st = this.stats || { time: 0, saved: 0, sigils: [], dmg: 0, cont: 0, players: [] };
    let pts = 0;
    pts += st.time < 220 ? 2 : st.time < 320 ? 1 : 0;
    pts += st.dmg < 120 ? 2 : st.dmg < 350 ? 1 : 0;
    pts += st.cont === 0 ? 2 : 0;
    pts += st.sigils.length;
    st.rank = pts >= 8 ? 'S' : pts >= 6 ? 'A' : pts >= 4 ? 'B' : 'C';
    this.stats = st;
  },
  tickSummary(dt, ctrls) {
    this.sumT += dt;
    if (this.sumT > 2.2 && (this.anyPress(ctrls, 'start', 'punch', 'jump') || Input.keyEdge.Enter)) { const t = this.afterSum; this.afterSum = null; t && t(); }
  },
  pause() {
    if (this.online === 'client') return;
    this.pausedFrom = this.mode;
    this.mode = 'pause';
    this.back = () => this.resume();
    if (this.online === 'host') this.broadcastView({ m: 'pause' });
    UI.show(`<span class="eyebrow">PAUSA</span><h2>Porto Aurora può aspettare.</h2>
      <nav class="col"><button class="primary" id="resume" autofocus>RIPRENDI</button><button id="retry" ${this.credits > 0 ? '' : 'disabled'}>RICOMINCIA LA ZONA (1 CREDITO)</button><button id="help">COME SI GIOCA</button><button id="audio">AUDIO: ${Audio.muted ? 'SPENTO' : 'ACCESO'}</button><button id="opts">OPZIONI E COMANDI</button><button id="menu">ESCI AL MENU</button></nav>`, 'center');
    UI.on('#opts', () => this.options('pause'));
    UI.on('#resume', () => this.resume());
    UI.on('#retry', () => { if (!(this.credits > 0)) return; this.credits--; UI.hide(); if (this.pausedFrom === 'giant') { this.G = newGiant(this.levelIdx, this.simPlayers()); this.mode = 'giant'; } else this.enterStage(this.levelIdx, this.S.checkpoint); });
    UI.on('#help', () => { const from = this.pausedFrom; this.howto(() => { this.mode = from; this.pause(); this.pausedFrom = from; }); });
    UI.on('#audio', () => { const from = this.pausedFrom; Audio.setMuted(!Audio.muted); this.mode = from; this.pause(); });
    UI.on('#menu', () => this.menu());
  },
  resume() { UI.hide(); this.mode = this.pausedFrom || 'stage'; this.back = null; Input.keyEdge = {}; this.capture = null; },

  /* ---------------- controls ---------------- */
  gatherInputs() {
    // called once per rendered frame: merge edges so that no press is lost
    for (const p of this.players) {
      if (p.device === 'remote' || p.device === 'gone') continue;
      const c = Input.read(p.device);
      this.heldBuf[p.id] = c;
      const e = this.edgeBuf[p.id] || (this.edgeBuf[p.id] = {});
      for (const b of BTN) if (c.pressed[b]) e[b] = true;
    }
  },
  controls() {
    const out = {};
    for (const p of this.players) {
      if (p.device === 'remote') { out[p.id] = Net.controlFor(p.id); continue; }
      const h = this.heldBuf[p.id] || EMPTY_CTRL;
      out[p.id] = { l: h.l, r: h.r, u: h.u, d: h.d, held: h.held, pressed: this.edgeBuf[p.id] || {} };
      this.edgeBuf[p.id] = {};
    }
    return out;
  },
  anyPress(ctrls, ...btns) { return Object.values(ctrls).some((c) => btns.some((b) => c.pressed[b])); },

  /* ---------------- fixed-step update ---------------- */
  step(dt) {
    switch (this.mode) {
      case 'intro': {
        const c = this.controls();
        this.prevIntroT = this.introT;
        this.introT += dt;
        introSounds(this.prevIntroT, this.introT);
        if (this.introT > INTRO_LEN || (this.introT > 0.6 && (this.anyPress(c, 'punch', 'start', 'jump') || Input.keyEdge.Enter || (this.attract && Object.keys(Input.keyEdge).length)))) {
          if (this.galleryIntro) { this.galleryIntro = false; this.gallery(); break; }
          if (this.attract) { if (this.introT <= INTRO_LEN) { Audio.unlock(); this.menu(); } else this.title(); break; }
          if (!this.tutorialSeen()) this.howto(() => this.chapterStart(0), 'PUGNO / INVIO: INIZIA LA PARTITA · ◀ ▶ PAGINA');
          else this.chapterStart(0);
        }
        break;
      }
      case 'dlg': {
        const c = this.controls();
        const d = this.dlg;
        d.t += dt;
        const line = d.lines[d.i];
        const full = line.card ? 2.6 : line[1].length / 48;
        const skipAll = this.anyPress(c, 'start');
        const adv = this.anyPress(c, 'punch', 'jump', 'shoot');
        if (skipAll) { d.i = d.lines.length; }
        else if (adv) { if (d.t < full && !line.card) d.t = full; else { d.i++; d.t = 0; Audio.sfx('select'); } }
        else if (d.t > full + (line.card ? 0 : 4.5)) { d.i++; d.t = 0; }
        if (d.i >= d.lines.length) { const then = this.afterDialog; this.afterDialog = null; then && then(); }
        break;
      }
      case 'stage': {
        const c = this.controls();
        if (this.online !== 'client' && Object.entries(c).some(([id, cc]) => cc.pressed.start && this.players.find((p) => p.id === +id && p.device !== 'remote')) && !this.S.players.every((p) => p.out)) {
          const pausers = this.S.players.filter((p) => !p.out);
          if (pausers.length) { this.pause(); break; }
        }
        stepStage(this.S, c, dt);
        this.credits = this.S.credits;
        this.pendingEv.push(...this.S.events);
        // boss music (assets/music/boss.mp3, if present)
        if (this.S.bossId && this._bossSong !== this.S.bossId && !this.S.L.rush) { this._bossSong = this.S.bossId; Audio.playSong(this.S.L.music, 'boss'); }
        if (this.S.result) { const r = this.S.result; this.S.result = null; this.stageResult(r); break; }
        if (this.S.players.every((p) => p.out)) this.gameOver('stage');
        break;
      }
      case 'giant': {
        const c = this.controls();
        if (Object.entries(c).some(([id, cc]) => cc.pressed.start && this.players.find((p) => p.id === +id && p.device !== 'remote'))) { this.pause(); break; }
        stepGiant(this.G, c, dt);
        this.pendingEv.push(...this.G.events);
        if (this.G.result === 'win') { this.G.result = null; this.carryScores(this.G.players); this.levelClear(); }
        else if (this.G.result === 'lose') { this.G.result = null; this.gameOver('giant'); }
        break;
      }
      case 'howto': this.tickHowto(dt, this.controls()); break;
      case 'cont': this.tickCont(dt, this.controls()); break;
      case 'final': this.tickFinal(dt, this.controls()); break;
      case 'summary': this.tickSummary(dt, this.controls()); break;
      case 'cine': {
        const c = this.controls();
        const cn = this.cine;
        cn.prev = cn.t; cn.t += dt;
        cineSounds(cn.id, cn.prev, cn.t);
        if (cn.t > cineLength(cn.id) || (cn.t > 0.8 && (this.anyPress(c, 'punch', 'start', 'jump') || Input.keyEdge.Enter))) { const then = this.afterCine; this.afterCine = null; then && then(); }
        break;
      }
      case 'ending': {
        const c = this.controls();
        this.endT += dt;
        if (this.endT > 5 && (this.anyPress(c, 'punch', 'start', 'jump') || Input.keyEdge.Enter || (this.galleryEnd && (Input.keyEdge.Escape || this.padOk())))) {
          if (this.galleryEnd) { this.galleryEnd = false; this.gallery(); break; }
          this.runResult = { kind: 'campaign', end: true };
          this.afterRun();
        }
        break;
      }
      case 'demo': this.tickDemo(dt); break;
      case 'entry': this.tickEntry(dt, this.controls()); break;
      case 'scores': this.tickScores(dt, this.controls()); break;
      case 'gallery': this.controls(); this.tickGallery(dt); break;
      default: this.controls();
    }
  },

  /* view to draw on this machine, and to send to online guests */
  currentView() {
    switch (this.mode) {
      case 'stage': return buildView(this.S);
      case 'giant': return buildGiantView(this.G);
      case 'dlg': { const l = this.dlg.lines[this.dlg.i]; return { m: 'dlg', lv: this.levelIdx, lines: this.dlg.lines.map((x) => x.card ? ['', ''] : x), card: l && l.card ? 1 : 0, i: this.dlg.i, t: +this.dlg.t.toFixed(2), heroes: this.players.map((p) => p.hero) }; }
      case 'intro': return { m: 'intro', t: +this.introT.toFixed(2) };
      case 'howto': return { m: 'howto', t: +this.howT.toFixed(2), pg: this.howPg, sc: this.howScheme, f: this.howFooter || '' };
      case 'cine': return { m: 'cine', id: this.cine.id, t: +this.cine.t.toFixed(2) };
      case 'cont': return { m: 'cont', t: +this.contT.toFixed(2), cr: this.credits === Infinity ? -1 : this.credits };
      case 'final': return { m: 'final', t: +this.finalT.toFixed(2) };
      case 'summary': return { m: 'summary', t: +this.sumT.toFixed(2), st: this.stats };
      case 'ending': return { m: 'ending', t: +this.endT.toFixed(2), heroes: this.players.map((p) => p.hero), un: this.unlockMsg && !this.galleryEnd ? 1 : 0 };
      case 'pause': return { m: 'pause' };
      case 'demo': return this.demo ? { ...buildView(this.demo.S), demo: 1 } : null;
      case 'entry': { const E = this.entry; if (!E) return null; const cur = E.queue[E.i]; const r = cur.rec;
        const val = E.kind === 'timeattack' ? 'TEMPO ' + fmtTime(r.tm) : E.kind === 'survival' ? `ONDATE ${r.w} · ${r.s} PUNTI` : E.kind === 'bossrush' ? `BOSS ${r.b}/8 · ${r.s} PUNTI` : `${r.s} PUNTI`;
        return { m: 'entry', kind: E.kind, t: +E.t.toFixed(2), letters: E.letters.slice(), pos: E.pos, h: cur.p.hero, pl: this.players.indexOf(cur.p) + 1, val }; }
      case 'scores': { const s = this.sc; const kind = BOARDS[s.b].id; return { m: 'scores', b: s.b, t: +s.t.toFixed(2), lvl: s.lvl, rows: this.sortBoard(kind, this.boardList(kind, s.lvl)).slice(0, kind === 'timeattack' ? 5 : 10), me: this.lastRec || null }; }
      case 'gallery': return { m: 'gallery', pg: this.gal.pg, i: this.gal.i, t: +this.gal.t.toFixed(2) };
      case 'over': return { m: 'over' };
    }
    return null;
  },
  broadcastView(v) { Net.broadcast({ k: 'v', v }); },

  draw(v) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    if (!v) return;
    switch (v.m) {
      case 'stage': renderStage(v); if (v.demo) drawDemoOverlay(v.t); break;
      case 'entry': drawEntry(v); break;
      case 'scores': drawScores(v); break;
      case 'gallery': drawGallery(v); break;
      case 'giant': renderGiant(v); break;
      case 'dlg': drawDialog(v); break;
      case 'intro':
        if (this.online === 'client') { introSounds(this._cIntroT || 0, v.t); this._cIntroT = v.t; }
        drawIntro(v.t); break;
      case 'ending': drawEnding(v.t, v.heroes); if (v.un && v.t > 4) { panel(W / 2 - 330, 90, 660, 70, '#ffd35a', 0.9); ptitle('SBLOCCATI: KHARON E COSTUME ORO', W / 2, 128, 16, '#ffffff', '#ffd35a'); ptxt('SCEGLILI NELLA SCHERMATA DEI GIOCATORI · NUOVE VOCI IN GALLERIA', W / 2, 150, 8, '#fff1c6', 'center'); } break;
      case 'cont': drawContinue(v); break;
      case 'final': drawFinal(v); break;
      case 'summary': drawSummary(v); break;
      case 'howto': {
        const scheme = this.online === 'client' ? ((this.lastDevice || 'kb').startsWith('pad') ? 'pad' : 'kb') : v.sc;
        const hero = ((this.players[0] && this.players[0].hero) || 0) % CORE_HEROES;
        this.howT = v.t;
        drawHowto(v.pg, v.t, scheme, this.online === 'client' ? (Net.lobby.find((p) => p.id === Net.myId) || { hero: 0 }).hero : hero, { footer: v.f || undefined });
        break;
      }
      case 'cine':
        if (this.online === 'client') { cineSounds(v.id, this._cCineT ?? v.t, v.t); this._cCineT = v.t; }
        drawChapterCine(v.id, v.t); break;
      case 'pause': case 'over': {
        if (this.lastDrawn && this.lastDrawn.m !== 'pause' && this.lastDrawn.m !== 'over') this.draw(this.lastDrawn);
        if (this.online === 'client') {
          g.fillStyle = 'rgba(3,8,16,.75)'; g.fillRect(0, 0, W, H);
          txt(v.m === 'pause' ? 'PAUSA' : 'SCONFITTA', W / 2, H / 2 - 10, 48, '#f5dcad', 'center', 900);
          txt('In attesa dell\'host…', W / 2, H / 2 + 36, 18, '#c8d6e4', 'center', 700);
        }
        return;
      }
    }
    if (v.m !== 'pause' && v.m !== 'over') {
      if (this.lastDrawn && this.lastDrawn.m !== v.m) this.wipeT = 0;
      this.lastDrawn = v;
    }
    this.drawWipe();
  },
  /* tokusatsu wipe: five coloured diagonal bands slide away revealing the new scene */
  drawWipe() {
    if (this.wipeT === undefined || this.wipeT > 0.55) return;
    const k = this.wipeT / 0.55;
    const E = -350 + k * (W + 1000);     // reveal edge sweeping to the right
    g.save();
    g.fillStyle = '#05070c';
    g.beginPath(); g.moveTo(E + 300, 0); g.lineTo(W + 400, 0); g.lineTo(W + 400, H); g.lineTo(E, H); g.fill();
    HEROES.slice(0, CORE_HEROES).forEach((h, i) => {
      const x = E - (i + 1) * 46;
      g.fillStyle = h.color;
      g.beginPath(); g.moveTo(x + 300, 0); g.lineTo(x + 346, 0); g.lineTo(x + 46, H); g.lineTo(x, H); g.fill();
    });
    g.restore();
  },

};

/* ---------------- main loop ---------------- */
let lastT = 0, acc = 0;
const STEP = 1 / 60;
function frame(ts) {
  const dt = Math.min(0.1, (ts - lastT) / 1000 || STEP);
  lastT = ts;
  // remember the last device that pressed something (for auto-join)
  if (Object.keys(Input.keyEdge).length) Game.lastDevice = 'kb';
  for (const p of Input.pads()) { const c = Input.read('pad' + p.index); if (Object.values(c.pressed).some(Boolean)) Game.lastDevice = 'pad' + p.index; }
  if (Input.keyEdge.KeyM && !UI.typing() && !Game.capture) Audio.setMuted(!Audio.muted);

  if (!Game.pollPadCapture() && !Game.capture) UI.nav();
  if (Game.wipeT !== undefined) Game.wipeT += dt;
  if (Game.mode === 'title') { Game.tickTitle(dt); g.setTransform(1, 0, 0, 1, 0, 0); drawTitle(Game.titleT); }
  else if (Game.mode === 'lobby') { Game.tickLobby(dt); Game.draw(null); Game.drawLobby(false); }
  else if (Game.mode === 'netlobby') { Game.tickNetLobby(dt); g.setTransform(1, 0, 0, 1, 0, 0); Game.drawLobby(true); }
  else if (Game.mode === 'client') {
    // online guest: send controls, draw what the host sends
    const dev = Game.lastDevice || 'kb';
    const c = Input.read(dev);
    Net.sendInput(c, dt);
    stepFX(dt);
    Game.draw(Net.view());
    if (!Net.lastView) { g.fillStyle = '#050c14'; g.fillRect(0, 0, W, H); txt('In attesa dell\'host…', W / 2, H / 2, 24, '#c8d6e4', 'center', 800); }
  } else if (Game.mode === 'menu' || Game.mode === 'loading') {
    // animated backdrop behind the DOM menu
    g.setTransform(1, 0, 0, 1, 0, 0);
    Game.menuT = (Game.menuT || 0) + dt;
    if (IMG.port) {
      drawStageBackdrop('port', 300);
      g.fillStyle = 'rgba(3,8,16,.35)'; g.fillRect(0, 0, W, H);
      const k = Game.menuT;
      HEROES.slice(0, CORE_HEROES).forEach((h, i) => { const x = 700 + i * 110, y = 620 + (i % 2) * 30; drawShadow(x, y, 36); spr('fighters', `${h.id}_${Math.floor(k * 1.5 + i) % 7 === 0 ? 4 : 0}`, x, y, { scale: 1.0, face: -1 }); });
    }
  } else {
    Game.gatherInputs();
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) { Game.step(STEP); acc -= STEP; n++; }
    if (n === 5) acc = 0;
    const v = Game.currentView();
    if (v && (v.m === 'stage' || v.m === 'giant')) { applyEvents(Game.pendingEv, v.m === 'stage'); }
    else if (Game.pendingEv.length) Game.pendingEv.length = 0;
    if (Game.online === 'host') {
      Game.sendT -= dt;
      if (Game.sendT <= 0 && v) {
        Game.sendT = 1 / 20;
        const out = { ...v, ev: Game.netEv || [] };
        Game.broadcastView(out);
        Game.netEv = [];
      }
      Game.netEv = (Game.netEv || []).concat(Game.pendingEv);
    }
    Game.pendingEv = [];
    stepFX(dt);
    Game.draw(v);
  }
  if (Net.role) Net.watchdog();
  Audio.update();
  Input.endFrame();
  requestAnimationFrame(frame);
}

/* ---------------- boot ---------------- */
Input.init();
const IMAGES = [
  ['fighters', 'assets/sprites/fighters.png'], ['bosses', 'assets/sprites/bosses.png'], ['titans', 'assets/sprites/titans.png'], ['giants', 'assets/sprites/giants.png'], ['extra', 'assets/sprites/extra.png'], ['bosses2', 'assets/sprites/bosses2.png'],
  ['cine_run', 'assets/bg/cine_run.jpg'], ['cine_duel', 'assets/bg/cine_duel.jpg'], ['cine_rex', 'assets/bg/cine_rex.jpg'], ['cine_cavern', 'assets/bg/cine_cavern.jpg'], ['cine_cockpit', 'assets/bg/cine_cockpit.jpg'], ['cine_dawn', 'assets/bg/cine_dawn.jpg'],
  ['items', 'assets/sprites/items.png'], ['people', 'assets/sprites/people.png'],
  ['port', 'assets/bg/port.jpg'], ['harbor', 'assets/bg/harbor.jpg'], ['rail', 'assets/bg/rail.jpg'], ['park', 'assets/bg/park.jpg'],
  ['theater', 'assets/bg/theater.jpg'], ['siege', 'assets/bg/siege.jpg'], ['graveyard', 'assets/bg/graveyard.jpg'], ['veil', 'assets/bg/veil.jpg'],
  ['dawn', 'assets/bg/dawn.jpg'], ['story_cores', 'assets/bg/story_cores.jpg'], ['logo', 'assets/ui/logo.png'],
];
try { const k = localStorage.getItem('primal-diff'); if (k && DIFFS[k]) DIFF = DIFFS[k]; } catch (e) {}
Audio.loadVolumes();
loadKeymaps();
Promise.all([loadFonts(), loadImages(IMAGES)]).then(() => {
  document.querySelector('#loading').remove();
  Game.title();
  requestAnimationFrame(frame);
}).catch((src) => {
  document.querySelector('#loading').textContent = 'File mancante: ' + src + ' — estrai tutto lo ZIP prima di aprire index.html.';
});

/* read-only diagnostics for automated tests */
window.gameStatus = () => ({
  mode: Game.mode, level: Game.levelIdx, online: Game.online,
  players: Game.S ? Game.S.players.map((p) => ({ id: p.id, hero: HEROES[p.hero].id, x: Math.round(p.x), y: Math.round(p.y), hp: p.hp, st: p.st, lives: p.lives, score: p.score, civil: !!p.civil })) : [],
  zone: Game.S ? Game.S.zoneIdx : 0, enemies: Game.S ? Game.S.enemies.filter((e) => e.hp > 0).length : 0, kind: Game.modeKind,
  ride: Game.S && Game.S.ride ? Math.round(Game.S.ride.hp) : null, wave: Game.S && Game.S.sv ? Game.S.sv.wave : null,
  giant: Game.G ? { thp: Game.G.pl.hp, ehp: Game.G.en.hp } : null,
});

/* ---------------- title screen ---------------- */
function drawTitle(t) {
  drawStageBackdrop('port', 300);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, 'rgba(3,6,16,.75)'); grd.addColorStop(0.6, 'rgba(3,6,16,.35)'); grd.addColorStop(1, 'rgba(3,6,16,.85)');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // heroes line-up with coloured back-lights
  HEROES.slice(0, CORE_HEROES).forEach((h, i) => {
    const x = 240 + i * 200, y = 700;
    glowAt(x, y - 80, 150, h.color, 0.25 + 0.1 * Math.sin(t * 2 + i));
    drawShadow(x, y, 40);
    spr('fighters', `${h.id}_${Math.floor(t * 1.2 + i * 1.7) % 9 === 0 ? 4 : 0}`, x, y, { scale: 1.05, face: i < 2 ? 1 : i === 2 ? 1 : -1 });
  });
  // logo drops in with a bounce, then a flash
  const k = clamp(t / 0.8, 0, 1);
  const bounce = k < 1 ? (1 - Math.pow(1 - k, 3)) : 1;
  const y = lerp(-320, 225, bounce) + (k >= 1 ? Math.sin(Math.min(1, (t - 0.8) * 4) * Math.PI) * -12 * Math.max(0, 1 - (t - 0.8) * 2) : 0);
  drawLogo(W / 2, y, 0.74, t);
  if (t > 0.8 && t < 1.2) { g.fillStyle = `rgba(255,255,255,${(1.2 - t) * 2})`; g.fillRect(0, 0, W, H); }
  if (t > 1.3 && Math.floor(t * 2.2) % 2 === 0) ptitle('PREMI START', W / 2, 452, 24, '#ffffff', '#ffd35a');
  ptxt('© 2026 b3pZ · 1-4 GIOCATORI · COOPERATIVA ONLINE', W / 2, 486, 9, '#9fb4c8', 'center');
  ptxt('CREDITI  99', W - 24, H - 16, 9, '#6f8aa2', 'right');
}
