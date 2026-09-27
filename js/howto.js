'use strict';
/* ============================================================
   COME SI GIOCA — tutorial animato in stile cabinato.
   A sinistra un ranger dimostra la mossa, a destra i tasti
   (tastiera, controller o due giocatori) si illuminano a tempo.
   ============================================================ */
const HOWTO_PAGE = 8.4;
const SCHEMES = ['kb', 'pad', 'kb2'];
const SCHEME_NAMES = { kb: 'TASTIERA', pad: 'CONTROLLER', kb2: 'DUE GIOCATORI SU UNA TASTIERA' };
const ACT_KEYS = {
  kb: { up: 'W', left: 'A', down: 'S', right: 'D', punch: 'J', shoot: 'K', special: 'L', jump: 'SPAZIO', dodge: 'SHIFT', team: 'I' },
  pad: { up: '▲', left: '◀', down: '▼', right: '▶', punch: 'X', shoot: 'Y', special: 'B', jump: 'A', dodge: 'RB', team: 'LB' },
  kb2: { up: 'W', left: 'A', down: 'S', right: 'D', punch: 'F', shoot: 'G', special: 'R', jump: 'SPAZIO', dodge: 'SHIFT', team: 'T' },
};
const walkF = (t) => [1, 2, 3, 2][Math.floor(t * 8) % 4];

/* each page: title, caption(keys, state) and a script(t) → { hero pose, enemy, lit actions } */
const HOWTO = [
  {
    title: 'MUOVITI', cap: (k) => `${k.up} ${k.left} ${k.down} ${k.right}: CAMMINA · DOPPIO TOCCO ${k.right}: CORSA`,
    run(t) {
      const seq = [['right', 1.4], ['up', 1], ['left', 1.4], ['down', 1], ['dash', 2.2], ['idle', 1.4]];
      let acc = 0, x = 220, y = 560, act = 'idle', local = 0;
      for (const [a, d] of seq) {
        const k = clamp((t - acc) / d, 0, 1);
        if (a === 'right') x += k * 150; if (a === 'left') x -= k * 150;
        if (a === 'up') y -= k * 60; if (a === 'down') y += k * 60;
        if (t >= acc && t < acc + d) { act = a; local = t - acc; }
        acc += d;
      }
      if (act === 'dash') x = 220 + clamp((t - 5.8) / 2.2, 0, 1) * 300; else if (t > 8) x = 520;
      const walking = act !== 'idle';
      const lit = act === 'dash' ? (local < 0.12 || (local > 0.24 && local < 1.9) ? ['right'] : []) : walking ? [act] : [];
      return { x, y, face: act === 'left' ? -1 : 1, f: walking ? [1, 2, 3, 2][Math.floor(t * (act === 'dash' ? 14 : 8)) % 4] : 0, ghost: act === 'dash', lit, note: act === 'dash' ? 'CORSA!' : '' };
    },
  },
  {
    title: 'ATTACCO: LA COMBO', cap: (k) => `${k.punch} ${k.punch} ${k.punch} ${k.punch}: PUGNO, CALCIO E DUE COLPI CON LA TUA ARMA`,
    run(t) {
      const beats = [0.9, 1.25, 1.62, 2.05];
      let f = 0, wf = 0, lit = [], enemy = { f: 0, x: 540, rot: 0 };
      beats.forEach((b, i) => {
        if (t > b && t < b + 0.36) {
          lit = ['punch'];
          if (i === 0) f = t < b + 0.06 ? 4 : 5;
          else if (i === 1) f = t < b + 0.06 ? 4 : 6;
          else wf = t < b + 0.12 ? 8 : i === 3 ? 10 : 9;
          if (i < 3) enemy.f = 7;
        }
      });
      if (t > 2.2) { const k = clamp((t - 2.2) / 0.5, 0, 1); enemy.x = 540 + k * 150; enemy.rot = -k * 1.5; enemy.z = Math.sin(k * Math.PI) * 60; enemy.f = 7; }
      if (t > 4) { enemy.rot = -1.5 * clamp(1 - (t - 4) / 0.4, 0, 1); enemy.f = t > 4.4 ? 0 : 4; enemy.z = 0; enemy.x = 690 - clamp((t - 4.4) / 1, 0, 1) * 150; }
      const note = t > 0.9 && t < 1.25 ? 'PUGNO' : t > 1.25 && t < 1.62 ? 'CALCIO' : t > 1.62 && t < 2.05 ? 'ARMA!' : t > 2.05 && t < 2.9 ? 'COLPO FINALE!' : '';
      return { x: 420, y: 580, face: 1, f, wf, lit, enemy, note, slash: wf ? (wf === 10 ? 2 : 1) : 0 };
    },
  },
  {
    title: 'LA PISTOLA', cap: (k) => `${k.shoot}: SPARA · ${k.up} + ${k.shoot}: SPARA IN ALTO CONTRO I DRONI · CARICATORI NELLE CASSE E DAI NEMICI`,
    run(t) {
      const shots = [0.9, 1.5, 2.1];
      let f = 0, lit = [], gun = false, bolts = [], ammo = 8, enemy = { f: 0, x: 640 };
      shots.forEach((b) => {
        if (t > b) ammo--;
        if (t > b && t < b + 0.3) { f = t < b + 0.05 ? 4 : 5; gun = true; lit = ['shoot']; }
        const bx = 500 + (t - b) * 900;
        if (t > b && bx < 620) bolts.push(bx);
        if (bx >= 620 && t < b + 0.5) enemy.f = 7;
      });
      if (t > 4) { const k = clamp((t - 4) / 1, 0, 1); enemy.x = 640; if (t > 4.6 && t < 5.2) { enemy.f = 0; } }
      return { x: 420, y: 580, face: 1, f, lit, gun, bolts, ammoHud: ammo, enemy, note: t > 0.9 && t < 2.6 ? 'BANG!' : '' };
    },
  },
  {
    title: 'SALTO E CALCIO VOLANTE', cap: (k) => `${k.jump}: SALTO (SUL TRENO SALTA I BUCHI TRA I VAGONI) · ${k.jump} + ${k.punch}: CALCIO VOLANTE`,
    run(t) {
      let f = 0, lit = [], z = 0, x = 380, enemy = { f: 0, x: 580 };
      if (t > 0.8 && t < 1.6) { const k = (t - 0.8) / 0.8; z = Math.sin(k * Math.PI) * 130; f = 4; if (t < 0.95) lit = ['jump']; }
      if (t > 3 && t < 4.2) {
        const k = (t - 3) / 1.2; z = Math.sin(k * Math.PI) * 150; x = 380 + k * 140; f = t > 3.45 ? 6 : 4;
        lit = t < 3.15 ? ['jump'] : t > 3.45 && t < 3.6 ? ['punch'] : [];
        if (t > 3.6) { enemy.f = 7; enemy.rot = -clamp((t - 3.6) * 4, 0, 1.5); enemy.x = 580 + (t - 3.6) * 200; }
      }
      if (t >= 4.2) { x = 520; enemy.f = 7; enemy.rot = -1.5; enemy.x = 700; if (t > 5.5) { enemy.rot = 0; enemy.f = 0; enemy.x = 600; } }
      return { x, y: 580, z, face: 1, f, lit, enemy, note: t > 3.4 && t < 4.2 ? 'VOLANTE!' : '' };
    },
  },
  {
    title: 'PRESE E LANCI', cap: (k) => `CAMMINA CONTRO UN NEMICO: LO AFFERRI · ${k.punch} GINOCCHIATE · INDIETRO + ${k.punch} LANCIO ALLE SPALLE · ${k.jump} LANCIO IN AVANTI`,
    run(t) {
      let f = 0, lit = [], x = 440, face = 1, enemy = { f: 7, x: 520, face: -1, tag: t < 1.2 }, enemy2 = { f: 0, x: 250 };
      if (t < 1.2) { f = walkF(t); x = 380 + t * 50; lit = ['right']; }
      if (t > 1.2 && t < 3.1) { f = 4; enemy.x = x + 52; enemy.z = 14; lit = []; }
      [1.8, 2.4].forEach((b) => { if (t > b && t < b + 0.26) { lit = ['punch']; f = t > b + 0.08 ? 6 : 4; } });
      if (t > 3.1) {
        face = -1; lit = t < 3.3 ? ['left', 'punch'] : [];
        const k = clamp((t - 3.1) / 0.7, 0, 1);
        f = t < 3.4 ? 5 : 0;
        enemy.x = x - 52 - k * 150; enemy.z = Math.sin(k * Math.PI) * 90; enemy.rot = k * 1.5; enemy.face = 1;
        if (k >= 1) { enemy2.f = 7; enemy2.rot = clamp((t - 3.8) * 4, 0, 1.5); enemy2.x = 250 - clamp((t - 3.8) * 150, 0, 60); }
      }
      return { x, y: 580, face, f, lit, enemy, enemy2, note: t > 1.2 && t < 3.1 ? 'PRESO!' : t > 3.2 && t < 4.6 ? 'LANCIO ALLE SPALLE!' : '' };
    },
  },
  {
    title: 'MOSSA SPECIALE', cap: (k, s) => `${k.special}: ${HEROES[s.hero || 0].special} · ${HEROES[s.hero || 0].specialText.toUpperCase()} · 40 ENERGIA`,
    run(t, loop) {
      const hero = loop % 5;
      let f = 0, lit = [], weapon = null, fx = null, en = 100;
      if (t > 1 && t < 2.4) {
        const k = t - 1;
        lit = k < 0.2 ? ['special'] : []; en = 60;
        const id = HEROES[hero].id;
        f = id === 'onyx' ? (k < 0.3 ? 4 : 5) : id === 'lyra' ? (Math.floor(k / 0.08) % 2 ? 5 : 6) : k < 0.16 ? 4 : 5;
        weapon = id === 'ignis' ? clamp(-1.6 + k / 0.16 * 1.9, -1.6, 0.3) : id === 'onyx' ? (k < 0.3 ? -2.0 : 0.95) : 0;
        fx = { id, k };
      } else if (t >= 2.4) en = 60;
      return { hero, x: 360, y: 580, face: 1, f, lit, weapon, fx, en, note: t > 1 && t < 2.6 ? HEROES[hero].special : '', enemy: { f: t > 1.3 && t < 2.6 ? 7 : 0, x: 620, rot: t > 1.4 && t < 2.6 ? -1.4 : 0 } };
    },
  },
  {
    title: 'SCHIVATA E OGGETTI', cap: (k) => `${k.dodge}: SCHIVATA · ROMPI LE CASSE: DENTRO CIBO, ENERGIA E CARICATORI`,
    run(t) {
      let f = 0, lit = [], x = 440, ghost = false, enemy = { f: 0, x: 560 }, crate = true, food = null;
      if (t > 0.7 && t < 1.2) enemy.f = t < 0.95 ? 4 : 5;
      if (t > 0.85 && t < 1.15) { ghost = true; lit = ['dodge']; x = 440 - (t - 0.85) * 400; f = 1; }
      if (t >= 1.15) x = 320;
      if (t > 3 && t < 3.3) { f = t < 3.06 ? 4 : 5; lit = ['punch']; }
      if (t > 3.8 && t < 4.1) { f = t < 3.86 ? 4 : 6; lit = ['punch']; }
      if (t > 3.95) { crate = false; food = { x: 250, z: Math.max(0, Math.sin(clamp((t - 3.95) / 0.5, 0, 1) * Math.PI) * 50) }; }
      if (t > 5) { const k = clamp((t - 5) / 0.8, 0, 1); x = 320 - k * 70; f = k < 1 ? walkF(t) : 0; lit = k < 1 ? ['left'] : []; }
      if (t > 5.8) food = null;
      return { x, y: 580, face: t > 2.5 ? -1 : 1, f, lit, ghost, enemy, crate, food, note: t > 0.85 && t < 1.6 ? 'SCHIVATA!' : t > 5.8 && t < 7 ? '+30 VITA' : '' };
    },
  },
  {
    title: 'COLPO DI SQUADRA', cap: (k) => `COLPISCI PER RIEMPIRE LA BARRA SQUADRA · ${k.team}: LE CINQUE ARMI DIVENTANO IL CANNONE PRIMORDIALE`,
    run(t) {
      const bar = clamp(t / 2.2, 0, 1);
      const lit = t > 2.6 && t < 2.9 ? ['team'] : [];
      if (t > 2.6 && !HOWTO_STATE.teamFired) { HOWTO_STATE.teamFired = true; FX.team = { t: 0, heroes: [HOWTO_STATE.hero || 0] }; Audio.sfx('team'); }
      return { x: 440, y: 580, face: 1, f: t < 2.2 ? [4, 5][Math.floor(t * 5) % 2] : 0, lit, team: bar, note: t > 2.2 && t < 2.6 ? 'BARRA PIENA!' : '', enemy: { f: t < 2.2 ? 7 : 0, x: 560 } };
    },
  },
  {
    title: 'DUELLI TRA GIGANTI', cap: (k) => `TIENI ${k.dodge}: PARATA · ${k.punch}: PUGNO · ${k.shoot}: COLPO PESANTE · SBILANCIA IL MOSTRO E PREMI ${k.special}: ARMA FINALE`,
    run(t) {
      let lit = [], guard = false, px = 380, beam = 0, stagger = false;
      if (t > 0.6 && t < 1.6) { guard = true; lit = ['dodge']; }
      [2.2, 2.6, 3.0, 3.4].forEach((b) => { if (t > b && t < b + 0.3) { lit = [b === 3.4 ? 'shoot' : 'punch']; px = 380 + Math.sin((t - b) / 0.3 * Math.PI) * 40; } });
      if (t > 3.8) stagger = true;
      if (t > 4.6 && t < 4.9) lit = ['special'];
      if (t > 4.9 && t < 6) beam = 1;
      return { giant: true, px, guard, beam, stagger, lit, bal: t < 2.2 ? 1 : clamp(1 - (t - 2.2) / 1.6, 0, 1), note: guard ? 'PARATA!' : stagger && t < 4.9 ? 'SBILANCIATO!' : beam ? 'ARMA FINALE!' : '' };
    },
  },
];
const HOWTO_STATE = { teamFired: false, hero: 0 };

function drawKey(x, y, label, lit, color, w = 58, h = 54) {
  const press = lit ? 4 : 0;
  g.fillStyle = '#05070c'; g.fillRect(x - 3, y - 3 + press, w + 6, h + 6);
  g.fillStyle = lit ? shadeCol(color) : '#3a4656'; g.fillRect(x, y + h - 8 + press, w, 8);
  g.fillStyle = lit ? color : '#c8d2dc'; g.fillRect(x, y + press, w, h - 8);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 4, y + 4 + press, w - 8, 4);
  if (lit) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45; g.fillStyle = color; g.fillRect(x - 10, y - 10 + press, w + 20, h + 20); g.restore(); }
  const sz = label.length > 3 ? 10 : 16;
  g.font = `400 ${sz}px ${PXFONT}`; g.textAlign = 'center'; g.fillStyle = '#10161e';
  g.fillText(label, x + w / 2, y + (h - 8) / 2 + sz / 2 + press);
}
function shadeCol(c) { return c === '#ffffff' ? '#9aa6b2' : c + '99'; }

function drawKeyboard(x, y, lit, color, scheme) {
  const k = ACT_KEYS[scheme === 'kb2' ? 'kb2' : 'kb'];
  const L = (a) => lit.includes(a);
  const lab = (t, xx, yy) => ptxt(t, xx, yy, 8, '#9fb4c8', 'center');
  // movement cluster
  drawKey(x + 66, y, k.up, L('up'), color);
  drawKey(x, y + 62, k.left, L('left'), color);
  drawKey(x + 66, y + 62, k.down, L('down'), color);
  drawKey(x + 132, y + 62, k.right, L('right'), color);
  lab('MUOVI', x + 95, y + 136);
  // attack keys
  const bx = x + 250;
  drawKey(bx + 66, y, k.team, L('team'), '#ffd35a');
  lab('SQUADRA', bx + 95, y - 10);
  drawKey(bx, y + 62, k.punch, L('punch'), color);
  drawKey(bx + 66, y + 62, k.shoot, L('shoot'), color);
  drawKey(bx + 132, y + 62, k.special, L('special'), color);
  lab('ATTACCO', bx + 29, y + 136); lab('PISTOLA', bx + 95, y + 136); lab('SPECIALE', bx + 161, y + 136);
  // bottom row
  drawKey(x, y + 160, k.dodge, L('dodge'), color, 124);
  drawKey(x + 150, y + 160, k.jump, L('jump'), color, 280);
  lab('SCHIVATA', x + 62, y + 236); lab('SALTO', x + 290, y + 236);
  if (scheme === 'kb2') ptxt('2P: FRECCE · K ATTACCO · L PISTOLA · I SALTO · O SPECIALE · P SQUADRA', x + 215, y + 272, 8, '#ffcf7a', 'center');
}
function drawPad(x, y, lit, color) {
  const L = (a) => lit.includes(a);
  g.save();
  // body
  g.fillStyle = '#05070c';
  roundRect(x - 4, y + 36, 468, 196, 90); g.fill();
  const grd = g.createLinearGradient(0, y + 40, 0, y + 230); grd.addColorStop(0, '#39465a'); grd.addColorStop(1, '#161d28');
  g.fillStyle = grd; roundRect(x, y + 40, 460, 188, 86); g.fill();
  // shoulders
  const sh = (sx, label, on) => { g.fillStyle = '#05070c'; roundRect(sx - 3, y - 3 + (on ? 4 : 0), 116, 42, 12); g.fill(); g.fillStyle = on ? color : '#8a96a6'; roundRect(sx, y + (on ? 4 : 0), 110, 36, 10); g.fill(); ptxt(label, sx + 55, y + 24 + (on ? 4 : 0), 12, '#10161e', 'center', false); };
  sh(x + 40, 'LB', L('team')); sh(x + 310, 'RB', L('dodge'));
  // d-pad
  const dx = x + 110, dy = y + 130;
  const dir = (a, ox, oy) => { g.fillStyle = L(a) ? color : '#1a212b'; g.fillRect(dx + ox - 18, dy + oy - 18, 36, 36); };
  g.fillStyle = '#05070c'; g.fillRect(dx - 58, dy - 22, 116, 44); g.fillRect(dx - 22, dy - 58, 44, 116);
  dir('up', 0, -36); dir('down', 0, 36); dir('left', -36, 0); dir('right', 36, 0); g.fillStyle = '#1a212b'; g.fillRect(dx - 18, dy - 18, 36, 36);
  // face buttons
  const fb = (bx, by, label, col, on) => {
    g.fillStyle = '#05070c'; g.beginPath(); g.arc(bx, by + (on ? 3 : 0), 27, 0, 7); g.fill();
    g.fillStyle = on ? '#ffffff' : col; g.beginPath(); g.arc(bx, by + (on ? 3 : 0), 23, 0, 7); g.fill();
    if (on) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.fillStyle = col; g.beginPath(); g.arc(bx, by, 40, 0, 7); g.fill(); g.restore(); }
    ptxt(label, bx, by + 8 + (on ? 3 : 0), 14, '#10161e', 'center', false);
  };
  const cx = x + 350, cy = y + 130;
  fb(cx, cy - 44, 'Y', '#f2c230', L('shoot'));
  fb(cx - 44, cy, 'X', '#3f86ff', L('punch'));
  fb(cx + 44, cy, 'B', '#ff4a3d', L('special'));
  fb(cx, cy + 44, 'A', '#58e0a0', L('jump'));
  g.restore();
  const lab = (t, xx, yy) => ptxt(t, xx, yy, 8, '#dfe8f0', 'center');
  lab('MUOVI', dx, y + 250); lab('SQUADRA', x + 95, y - 12); lab('SCHIVATA', x + 365, y - 12);
  lab('X ATTACCO · Y PISTOLA', cx, y + 250); lab('A SALTO · B SPECIALE', cx, y + 266);
}
function roundRect(x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* ---------- drawing the demo stage ---------- */
function puppet(heroIdx, s) {
  const id = HEROES[heroIdx].id;
  let f = s.f || 0;
  if (s.gun) f = 11;
  else if (s.weapon !== null && s.weapon !== undefined) f = s.fx ? (s.f === 4 ? 8 : 10) : (s.weapon < -0.5 ? 8 : 9);
  else if (s.z > 0 && f === 4) f = 12;
  if (s.wf) f = s.wf;
  const key = `${id}_${f}`;
  const z = s.z || 0;
  drawShadow(s.x, s.y, 36, z);
  if (s.ghost) for (let i = 2; i >= 1; i--) spr('fighters', key, s.x - s.face * i * 24, s.y - z, { scale: 1.0, face: s.face, alpha: 0.2 * (3 - i) });
  spr('fighters', key, s.x, s.y - z, { scale: 1.0, face: s.face });
  if (s.slash) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(s.x, s.y - 95); g.strokeStyle = HEROES[heroIdx].glow; g.lineWidth = s.slash === 2 ? 20 : 13; g.globalAlpha = 0.7; g.beginPath(); g.arc(0, 0, s.slash === 2 ? 150 : 120, -1.6, 0.8); g.stroke(); g.restore(); }
  if (s.weapon !== null && s.weapon !== undefined) drawSigWeapon('w_' + id, key, s.x, s.y - z, s.face, 1.0, s.weapon, HEROES[heroIdx].glow, Game.howT || 0);
  for (const bx of s.bolts || []) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = HEROES[heroIdx].glow; g.fillRect(bx - 40, s.y - 108, 50, 10); g.fillStyle = '#fff'; g.fillRect(bx - 20, s.y - 105, 26, 4); g.restore(); }
}
function enemyPuppet(e, y = 580, key = 'soldier') {
  if (!e || e.hide) return;
  const z = e.z || 0;
  drawShadow(e.x, y, 36, z);
  spr('fighters', `${key}_${e.f || 0}`, e.x + (e.rot ? -10 : 0), y - z, { scale: 1.0, face: e.face || -1, rot: e.rot || 0 });
  if (e.tag && Math.floor((Game.howT || 0) * 6) % 2) ptxt('PRESA!', e.x, y - 175, 10, '#ffe08a', 'center');
}

function drawHowto(pg, t, scheme, hero, opt = {}) {
  const P = HOWTO[pg];
  const loop = Math.floor(t / HOWTO_PAGE);
  const lt = t % HOWTO_PAGE;
  if (lt < 0.05) HOWTO_STATE.teamFired = false;
  HOWTO_STATE.hero = hero;
  if (HOWTO_STATE.pg !== pg) { HOWTO_STATE.pg = pg; FX.team = null; HOWTO_STATE.teamFired = false; }
  const s = P.run(lt, loop);
  const color = HEROES[s.hero ?? hero].color;
  // backdrop
  g.fillStyle = '#060b14'; g.fillRect(0, 0, W, H);
  // left: demo window
  const vx = 40, vy = 110, vw = 660, vh = 470;
  g.save();
  g.beginPath(); g.rect(vx, vy, vw, vh); g.clip();
  if (s.giant) {
    coverImage('siege', 1.0, 0.3, 0.5, 1);
    g.fillStyle = 'rgba(6,10,30,.35)'; g.fillRect(vx, vy, vw, vh);
    spr('titans', 'concordia_side', s.px - 150, vy + vh - 10, { scale: 0.62, flash: s.beam ? 0.3 : 0 });
    spr('bosses', `mastice_${s.stagger ? 6 : lt > 0.4 && lt < 1.6 ? 4 : 0}`, 520, vy + vh - 10, { scale: 0.62, face: -1, flash: s.beam ? 0.6 : 0 });
    if (s.guard) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.strokeStyle = '#bfe6ff'; g.lineWidth = 6; g.beginPath(); g.ellipse(s.px - 40, vy + 300, 34, 140, 0, -1.3, 1.3); g.stroke(); g.restore(); }
    if (s.beam) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffd35a'; g.globalAlpha = 0.7; g.fillRect(s.px - 120, vy + 240, 520, 60); g.fillStyle = '#fff'; g.fillRect(s.px - 120, vy + 258, 520, 24); g.restore(); }
    ptxt('EQUILIBRIO', 440, vy + 30, 8, '#f0c0a0');
    segBar(440, vy + 40, 220, 8, s.bal, 0, s.stagger ? '#fff1a6' : '#f0a05a', 5);
  } else {
    // a strip of the harbour as floor
    const img = IMG.port, sc = H / img.height;
    g.drawImage(img, 300 / sc, 0, vw / sc, img.height, vx, vy - 120, vw, H);
    g.fillStyle = 'rgba(4,8,16,.25)'; g.fillRect(vx, vy, vw, vh);
    if (s.crate) { drawShadow(250, 590, 30); spr('items', 'crate', 250, 590, { scale: 1.05 }); }
    if (s.food) { drawShadow(s.food.x, 590, 18); spr('items', 'pizza', s.food.x, 590 - s.food.z, { scale: 1.2 }); }
    const actors = [];
    if (s.enemy) actors.push([s.enemy.y || 580, () => enemyPuppet(s.enemy)]);
    if (s.enemy2) actors.push([580, () => enemyPuppet(s.enemy2)]);
    actors.push([s.y + 0.1, () => puppet(s.hero ?? hero, s)]);
    actors.sort((a, b) => a[0] - b[0]).forEach((a) => a[1]());
    if (s.fx) drawSpecialFx(s.fx, s, color);
    if (s.ammoHud !== undefined) { ptxt('COLPI', vx + 20, vy + 30, 8, '#bfe6ff'); ptxt('×' + s.ammoHud, vx + 90, vy + 32, 14, '#bfe6ff'); }
    if (s.en !== undefined) { ptxt('ENERGIA', vx + 20, vy + 30, 8, '#9fc8ea'); segBar(vx + 20, vy + 40, 200, 10, s.en / 100, 0, '#5fc2ff', 5); }
    if (s.team !== undefined) { ptxt('BARRA SQUADRA', vx + 20, vy + 30, 8, '#ffd35a'); segBar(vx + 20, vy + 40, 260, 10, s.team, 0, s.team >= 1 ? '#ffd35a' : '#9d8cff', 10); }
  }
  if (s.note) ptitle(s.note, vx + vw / 2, vy + 110, 22, '#fff6d6', '#ffb03a');
  g.restore();
  g.strokeStyle = color; g.lineWidth = 4; g.strokeRect(vx - 2, vy - 2, vw + 4, vh + 4);
  // right: controls
  const cx = 740, cy = 180;
  panel(cx - 20, vy, 520, vh, color, 0.9);
  ptxt(SCHEME_NAMES[scheme], cx + 240, vy + 34, 10, '#9fe8ff', 'center');
  if (scheme === 'pad') drawPad(cx + 10, cy + 20, s.lit, color);
  else drawKeyboard(cx + 20, cy + 30, s.lit, color, scheme);
  // header
  ptitle('COME SI GIOCA', W / 2, 62, 30, '#fff6d6', '#ffb03a');
  ptxt(`${pg + 1}/${HOWTO.length} · ${P.title}`, 40, 98, 12, color);
  // caption
  const cap = P.cap(ACT_KEYS[scheme], s);
  panel(40, 600, W - 80, 56, color, 0.85);
  const lines = wrapCap(cap, W - 140);
  lines.forEach((ln, i) => ptxt(ln, W / 2, 626 + i * 20 - (lines.length - 1) * 9, 11, '#f4f7fa', 'center'));
  ptxt(opt.footer || '◀ ▶ PAGINA · ▲ ▼ TASTIERA/CONTROLLER · PUGNO: ESCI', W / 2, 700, 9, '#8a9aac', 'center');
  // progress dots
  HOWTO.forEach((_, i) => { g.fillStyle = i === pg ? color : '#2a3848'; g.fillRect(W - 40 - (HOWTO.length - i) * 18, 88, 12, 12); });
  if (FX.team) drawTeamPose();
}
function wrapCap(t, maxW) {
  g.font = `400 11px ${PXFONT}`;
  const words = t.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  return lines;
}
function drawSpecialFx(fx, s, color) {
  const { id, k } = fx;
  g.save(); g.globalCompositeOperation = 'lighter';
  if (id === 'ignis' && k > 0.16 && k < 0.7) { const x = s.x + 70 + (k - 0.16) * 820; g.fillStyle = '#ff5a1e'; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(x - 30, s.y - 190); g.quadraticCurveTo(x + 80, s.y - 80, x - 30, s.y + 30); g.quadraticCurveTo(x + 20, s.y - 80, x - 30, s.y - 190); g.fill(); }
  if (id === 'azur' && k < 0.6) { g.fillStyle = '#8cc4ff'; g.globalAlpha = 0.5; g.fillRect(s.x - 200, s.y - 110, 200, 60); }
  if (id === 'lyra') { g.strokeStyle = '#ffe98a'; g.lineWidth = 4; g.globalAlpha = 0.9; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s.x + 70, s.y - 90 + i * 16, 34, -1.2 + k * 8, 0.6 + k * 8); g.stroke(); } }
  if (id === 'aura' && k > 0.2) { [-40, 0, 40].forEach((dy) => { const x = s.x + 60 + (k - 0.2) * 900; g.fillStyle = '#ff78bb'; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(x - 30, s.y - 130 + dy); g.quadraticCurveTo(x + 40, s.y - 80 + dy, x - 30, s.y - 30 + dy); g.quadraticCurveTo(x + 5, s.y - 80 + dy, x - 30, s.y - 130 + dy); g.fill(); }); }
  if (id === 'onyx' && k > 0.3) { g.strokeStyle = '#e3ecf5'; g.lineWidth = 8; g.globalAlpha = 1.3 - k; g.beginPath(); g.ellipse(s.x + 70, s.y, 30 + (k - 0.3) * 220, 10 + (k - 0.3) * 70, 0, 0, 7); g.stroke(); }
  g.restore();
}
