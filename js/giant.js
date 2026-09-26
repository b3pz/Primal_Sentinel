'use strict';
/* ============================================================
   DUELLO TRA GIGANTI — titano (o Concordia) contro mostro gigante.
   Tutti i giocatori pilotano insieme: ogni pilota può attaccare,
   parare e contribuire alla barra dell'arma finale.
   ============================================================ */
const TITAN_KINDS = {
  rex: { key: 'rex_side', name: 'TIRANNO ROSSO', scale: 1.75, hp: 520, jab: 'MORSO', heavy: 'CODATA', fin: 'RUGGITO PRIMORDIALE', color: '#ff5b4f' },
  concordia: { key: 'concordia_side', name: 'CONCORDIA', scale: 1.22, hp: 620, jab: 'PUGNO ZANNA', heavy: 'CARICA DEL CORNO', fin: 'ARMA FINALE · CUORE UNITO', color: '#ffd35a' },
};

function newGiant(levelIdx, players, prev) {
  const L = LEVELS[levelIdx];
  const conf = L.giant;
  const T = TITAN_KINDS[conf.player];
  const E = GIANTS[conf.enemy];
  const final = !!conf.final;
  const hpMul = 1 + (players.length - 1) * 0.12;
  return {
    phase: 'giant', lvl: levelIdx, L, t: 0, events: [], hitstop: 0, conf, T, E, final,
    players: players.map((p, i) => ({ id: p.id, slot: i, hero: p.hero, name: p.name, score: p.score || 0, lives: p.lives ?? 3, act: 0 })),
    pl: { x: 330, hp: T.hp * (final ? 1.2 : 1), max: T.hp * (final ? 1.2 : 1), st: 'intro', t: 0, cool: 0, en: 40, guard: false, flash: 0, off: 0 },
    en: { x: 930, hp: E.hp * hpMul, max: E.hp * hpMul, st: 'intro', t: 0, bal: 100, cool: 2.2, move: null, flash: 0, off: 0, pat: 0, walk: 0 },
    shots: [], result: null, banner: { text: final ? 'CONCORDIA ALBA' : T.name, sub: 'VS ' + E.name, t: 3 },
  };
}

function stepGiant(G, ctrls, dt) {
  G.events.length = 0;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  G.t += dt;
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  const P = G.pl, E = G.en, T = G.T;
  P.t += dt; E.t += dt;
  P.flash = Math.max(0, P.flash - dt); E.flash = Math.max(0, E.flash - dt);
  P.cool = Math.max(0, P.cool - dt);
  const gev = (e) => G.events.push(e);

  // merge controls of every pilot
  let dx = 0, guard = false, press = { punch: null, kick: null, special: null, jump: null };
  for (const pl of G.players) {
    const c = ctrls[pl.id] || EMPTY_CTRL;
    dx += (c.r ? 1 : 0) - (c.l ? 1 : 0);
    if (c.held.dodge || c.held.team) guard = true;
    for (const k of Object.keys(press)) if (c.pressed[k] && !press[k]) press[k] = pl;
    pl.act = Math.max(0, pl.act - dt);
    if (Object.keys(press).some((k) => press[k] === pl) || c.held.dodge) pl.act = 0.3;
  }
  dx = clamp(dx, -1, 1);

  // ---- player titan
  const dist = () => E.x - P.x;
  switch (P.st) {
    case 'intro': if (P.t > 1.5) { P.st = 'idle'; P.t = 0; } break;
    case 'idle': case 'walk': case 'guard': {
      P.guard = guard;
      if (guard) { P.st = 'guard'; break; }
      if (press.special) {
        if (E.st === 'stagger') { P.st = 'finisher'; P.t = 0; G.hitstop = 0.15; gev({ t: 'snd', n: 'team' }); gev({ t: 'flash', c: '#ffffff', v: 0.7 }); credit(G, press.special, 800); break; }
        if (P.en >= 50) { P.en -= 50; P.st = 'heavy'; P.t = 0; P.super = true; gev({ t: 'snd', n: 'special' }); credit(G, press.special, 200); break; }
      }
      if (press.punch && P.cool <= 0) { P.st = 'jab'; P.t = 0; P.hitDone = false; gev({ t: 'snd', n: 'punch' }); credit(G, press.punch, 50); break; }
      if (press.kick && P.cool <= 0) { P.st = 'heavy'; P.t = 0; P.super = false; P.hitDone = false; gev({ t: 'snd', n: 'wind' }); credit(G, press.kick, 80); break; }
      if (press.jump && P.cool <= 0) { P.st = 'step'; P.t = 0; P.stepDir = dx || 1; gev({ t: 'snd', n: 'stomp' }); break; }
      if (dx) { P.x += dx * 130 * dt; P.st = 'walk'; if (Math.floor(G.t * 2.2) !== Math.floor((G.t - dt) * 2.2)) gev({ t: 'snd', n: 'stomp' }), gev({ t: 'shake', v: 3 }); }
      else P.st = 'idle';
      break;
    }
    case 'step': P.x += P.stepDir * 520 * dt * (1 - P.t / 0.35); if (P.t > 0.35) { P.st = 'idle'; P.cool = 0.2; } break;
    case 'jab': {
      if (P.t > 0.14 && !P.hitDone) {
        P.hitDone = true;
        if (dist() < 470) giantHitEnemy(G, 16, 12);
      }
      if (P.t > 0.36) { P.st = 'idle'; P.cool = 0.08; }
      break;
    }
    case 'heavy': {
      const wind = P.super ? 0.35 : 0.5;
      if (P.t > wind && !P.hitDone) {
        P.hitDone = true;
        if (dist() < 510) giantHitEnemy(G, P.super ? 60 : 32, P.super ? 40 : 24, true);
        else gev({ t: 'shake', v: 6 });
        P.super = false;
      }
      if (P.t > wind + 0.4) { P.st = 'idle'; P.cool = 0.2; }
      break;
    }
    case 'finisher': {
      if (P.t > 0.6 && !P.hitDone) {
        P.hitDone = true;
        gev({ t: 'beam', x: P.x + 150, y: 330, dir: 1, len: 900, c: T.color, big: 1 });
        giantHitEnemy(G, Math.round(E.max * (G.final ? 0.3 : 0.34)), 0, true, true);
      }
      if (P.t > 1.6) { P.st = 'idle'; P.hitDone = false; if (E.st === 'stagger') { E.st = 'recover'; E.t = 0; E.bal = 100; } }
      break;
    }
    case 'hurt': if (P.t > 0.5) P.st = 'idle'; break;
    case 'down': if (P.t > 2.5) { G.result = 'lose'; } break;
  }
  P.x = clamp(P.x, 180, E.x - 230);

  // ---- enemy giant
  const phase2 = E.hp < E.max * 0.5;
  switch (E.st) {
    case 'intro': E.walk += dt * 3; if (E.t > 1.6) { E.st = 'idle'; E.t = 0; } break;
    case 'idle': {
      E.cool -= dt * (phase2 ? 1.3 : 1);
      E.bal = Math.min(100, E.bal + dt * 3);
      const want = 390;
      if (Math.abs(dist() - want) > 30) { E.x -= Math.sign(dist() - want) * 70 * dt; E.walk += dt * 3; }
      if (E.cool <= 0) {
        const pattern = G.final ? ['swipe', 'beam', 'charge', 'rain', 'swipe', 'beam'] : ['swipe', 'charge', 'swipe', 'beam', 'stomp'];
        E.move = pattern[E.pat++ % pattern.length];
        E.st = 'wind'; E.t = 0; gev({ t: 'snd', n: 'bosswind' });
      }
      break;
    }
    case 'wind': {
      const wt = { swipe: 0.9, charge: 1.0, beam: 1.2, stomp: 1.0, rain: 1.1 }[E.move] * (phase2 ? 0.8 : 1);
      if (E.t > wt) { E.st = 'atk'; E.t = 0; E.hitDone = false; }
      break;
    }
    case 'atk': {
      const m = E.move;
      if (m === 'charge') {
        E.x -= 900 * dt;
        if (!E.hitDone && dist() < 300) { E.hitDone = true; giantHitPlayer(G, G.E.dmg + 9); }
        if (dist() < 280 || E.t > 0.8) { E.st = 'recover'; E.t = 0; }
      } else if (!E.hitDone) {
        E.hitDone = true;
        if (m === 'swipe') { if (dist() < 560) giantHitPlayer(G, G.E.dmg); gev({ t: 'snd', n: 'heavy' }); }
        if (m === 'beam') { gev({ t: 'beam', x: E.x - 160, y: 360, dir: -1, len: 1100, c: '#c07bff', big: 1 }); gev({ t: 'snd', n: 'laser' }); giantHitPlayer(G, G.E.dmg + 6); }
        if (m === 'stomp') { gev({ t: 'shock', x: E.x - 120, y: 640, dir: -1 }); gev({ t: 'snd', n: 'stomp' }); gev({ t: 'shake', v: 16 }); G.shock = { x: E.x - 120, t: 0 }; }
        if (m === 'rain') { for (let i = 0; i < 5; i++) G.shots.push({ x: P.x - 200 + i * 110 + rand(-30, 30), y: -60 - i * 90, vy: 620, hit: false }); gev({ t: 'snd', n: 'laser' }); }
      }
      if (m !== 'charge' && E.t > 0.6) { E.st = 'recover'; E.t = 0; }
      break;
    }
    case 'recover': {
      if (E.move === 'charge') E.x += 200 * dt;
      if (E.t > 0.7) { E.st = 'idle'; E.t = 0; E.cool = rand(1.1, 2) * (phase2 ? 0.75 : 1); }
      break;
    }
    case 'hurt': if (E.t > 0.35) { E.st = 'idle'; E.t = 0; E.cool = Math.max(E.cool, 0.5); } break;
    case 'stagger': if (E.t > 3.2) { E.st = 'idle'; E.t = 0; E.bal = 60; } break;
    case 'dead': {
      if (E.t < 2.6 && Math.random() < dt * 16) gev({ t: 'boom', x: E.x + rand(-160, 160), y: rand(180, 600), big: 1 });
      if (Math.random() < dt * 5) gev({ t: 'snd', n: 'boom' });
      if (E.t > 3.2) G.result = 'win';
      break;
    }
  }
  E.x = clamp(E.x, P.x + 260, 1120);

  // shockwave travelling along the ground
  if (G.shock) {
    G.shock.t += dt; G.shock.x -= 700 * dt;
    if (!G.shock.hit && Math.abs(G.shock.x - P.x) < 90) { G.shock.hit = true; giantHitPlayer(G, G.E.dmg); }
    if (G.shock.x < -100) G.shock = null;
  }
  for (const s of G.shots) {
    s.y += s.vy * dt;
    if (!s.hit && s.y > 420 && Math.abs(s.x - P.x) < 140) { s.hit = true; giantHitPlayer(G, 9); }
    if (s.y > 700 && !s.boomed) { s.boomed = true; gev({ t: 'boom', x: s.x, y: 690, big: 1 }); }
  }
  G.shots = G.shots.filter((s) => s.y < 760);
}

function credit(G, pl, pts) { if (pl) { pl.score += pts; } }

function giantHitEnemy(G, dmg, bal, heavy = false, finisher = false) {
  const E = G.en;
  if (E.st === 'dead') return;
  const staggered = E.st === 'stagger';
  if (E.st === 'wind' && !heavy && !staggered) { dmg *= 0.6; }
  E.hp -= Math.round(dmg * (staggered && !finisher ? 1.5 : 1));
  E.flash = 0.15; E.off = heavy ? 40 : 18;
  G.pl.en = Math.min(100, G.pl.en + (heavy ? 10 : 6));
  G.players.forEach((p) => p.score += Math.round(dmg * 8));
  G.events.push({ t: 'spark', x: E.x - 90, y: 360 + rand(-60, 60), c: '#ffd06a', n: heavy ? 26 : 14, big: 1 });
  G.events.push({ t: 'snd', n: heavy ? 'heavy' : 'hit' });
  G.events.push({ t: 'shake', v: heavy ? 14 : 7 });
  G.hitstop = heavy ? 0.09 : 0.05;
  if (!staggered) {
    E.bal -= bal;
    if (E.bal <= 0 && E.hp > 0) {
      E.st = 'stagger'; E.t = 0; E.bal = 0;
      G.events.push({ t: 'txt', x: 640, y: 180, s: 'SBILANCIATO! PREMI SPECIALE!', c: '#fff1a6', size: 34, fixed: 1 });
      G.events.push({ t: 'snd', n: 'siren' });
    } else if (heavy && E.st !== 'atk') { E.st = 'hurt'; E.t = 0; }
  }
  if (E.hp <= 0) {
    E.hp = 0; E.st = 'dead'; E.t = 0; G.hitstop = 0.4;
    G.events.push({ t: 'flash', c: '#ffffff', v: 0.9 });
    G.events.push({ t: 'snd', n: 'boom' });
  }
}

function giantHitPlayer(G, dmg) {
  const P = G.pl;
  if (P.st === 'finisher' || P.st === 'down') return;
  if (P.guard || P.st === 'guard') {
    dmg = Math.round(dmg * 0.18);
    G.events.push({ t: 'spark', x: P.x + 140, y: 380, c: '#bfe6ff', n: 22, big: 1 });
    G.events.push({ t: 'txt', x: P.x + 60, y: 200, s: 'PARATA!', c: '#bfe6ff', size: 26 });
    G.events.push({ t: 'snd', n: 'weapon' });
    G.en.bal -= 8;
  } else {
    P.st = 'hurt'; P.t = 0; P.flash = 0.2; P.off = -40;
    G.events.push({ t: 'spark', x: P.x + 100, y: 380, c: '#ff7a5e', n: 22, big: 1 });
    G.events.push({ t: 'snd', n: 'hurt' });
    G.events.push({ t: 'shake', v: 16 });
  }
  P.hp -= dmg;
  if (P.hp <= 0) { P.hp = 0; P.st = 'down'; P.t = 0; G.events.push({ t: 'snd', n: 'ko' }); }
}

function buildGiantView(G) {
  const P = G.pl, E = G.en;
  P.off = lerp(P.off, 0, 0.2); E.off = lerp(E.off, 0, 0.2);
  // titan pose parameters (translation / rotation over time)
  let px = P.x, py = 690, prot = 0, psx = 1, glow = 0;
  const bob = Math.sin(G.t * 2.2) * 4;
  switch (P.st) {
    case 'jab': { const k = Math.sin(Math.min(1, P.t / 0.36) * Math.PI); px += k * 70; prot = k * 0.06; break; }
    case 'heavy': { const w = P.super ? 0.35 : 0.5; const k = P.t < w ? -P.t / w : Math.sin(Math.min(1, (P.t - w) / 0.4) * Math.PI); px += k * (k < 0 ? 40 : 120); prot = k * 0.09; glow = P.super ? 1 : 0; break; }
    case 'guard': psx = 0.97; prot = -0.05; break;
    case 'step': px += 0; prot = 0.04; break;
    case 'finisher': glow = 1; prot = -0.03; break;
    case 'hurt': prot = -0.08; px -= 20; break;
    case 'down': prot = -Math.min(1, P.t) * 0.5; py += Math.min(1, P.t) * 60; break;
    case 'walk': prot = Math.sin(G.t * 4.4) * 0.025; break;
  }
  const eDef = G.E;
  const eight = eDef.frames === 8;
  let ef = 0;
  switch (E.st) {
    case 'idle': case 'intro': ef = eight ? [0, 1, 2, 1][Math.floor(E.walk * 2) % 4] : [0, 1, 0, 2][Math.floor(E.walk * 2) % 4]; break;
    case 'wind': ef = 3; break;
    case 'atk': ef = eight ? (E.move === 'stomp' ? 5 : 4) : 4; break;
    case 'recover': ef = eight ? 4 : 4; break;
    case 'hurt': case 'stagger': ef = eight ? 6 : 5; break;
    case 'dead': ef = eight ? 7 : 5; break;
  }
  return {
    m: 'giant', lv: G.lvl, bg: G.conf.bg, t: +G.t.toFixed(2),
    pl: { k: G.T === TITAN_KINDS.rex ? 'rex' : 'concordia', x: Math.round(px + P.off), y: Math.round(py + bob * 0.3), r: +prot.toFixed(3), sx: psx, gl: glow, fl: P.flash > 0 ? 1 : 0, gd: P.guard || P.st === 'guard' ? 1 : 0, fin: P.st === 'finisher' ? +P.t.toFixed(2) : 0, fz: G.final ? 1 : 0 },
    en: { s: eDef.sprite, f: `${eDef.sprite}_${ef}`, x: Math.round(E.x + E.off), y: 690, sc: eDef.scale, fl: E.flash > 0 || (E.st === 'dead' && Math.floor(E.t * 12) % 2) ? 1 : 0, wn: E.st === 'wind' ? E.move : 0, a: E.st === 'dead' ? +Math.max(0, 1 - Math.max(0, E.t - 2.2) / 0.8).toFixed(2) : 1, st: E.st === 'stagger' ? 1 : 0 },
    sh: G.shock ? Math.round(G.shock.x) : 0,
    rn: G.shots.map((s) => [Math.round(s.x), Math.round(s.y)]),
    hud: {
      p: G.players.map((p) => ({ h: p.hero, n: p.name, sc: p.score, act: p.act > 0 ? 1 : 0, lv: p.lives })),
      thp: Math.round(P.hp), tmx: Math.round(P.max), ten: Math.round(P.en), tn: G.final ? 'CONCORDIA ALBA' : G.T.name,
      ehp: Math.round(E.hp), emx: Math.round(E.max), en: G.E.name, bal: Math.round(E.bal), stg: E.st === 'stagger' ? 1 : 0,
      ban: G.banner ? { t: G.banner.text, s: G.banner.sub, k: +G.banner.t.toFixed(2), e: +((G.banner.tot || (G.banner.tot = G.banner.t)) - G.banner.t).toFixed(2), b: 1 } : null,
      moves: [G.T.jab, G.T.heavy, G.T.fin],
    },
    ev: G.events.slice(),
  };
}
