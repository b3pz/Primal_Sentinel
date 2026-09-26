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
  kb: { up: 'W', left: 'A', down: 'S', right: 'D', punch: 'J', kick: 'K', special: 'L', jump: 'SPAZIO', dodge: 'SHIFT', team: 'I' },
  pad: { up: '▲', left: '◀', down: '▼', right: '▶', punch: 'X', kick: 'Y', special: 'B', jump: 'A', dodge: 'RB', team: 'LB' },
  kb2: { up: 'W', left: 'A', down: 'S', right: 'D', punch: 'F', kick: 'G', special: 'R', jump: 'SPAZIO', dodge: 'SHIFT', team: 'T' },
};

/* each page: title, caption(scheme) and a script(t) → { hero pose, enemy, lit actions } */
const HOWTO = [
  {
    title: 'MUOVITI', cap: (k) => `${k.up} ${k.left} ${k.down} ${k.right}: CAMMINA SUL LUNGOMARE · DOPPIO TOCCO ${k.right}: CORSA`,
    run(t) {
      const seq = [['right', 1.4], ['up', 1], ['left', 1.4], ['down', 1], ['dash', 2.2], ['idle', 1.4]];
      let acc = 0, x = 220, y = 560, act = 'idle', local = 0;
      for (const [a, d] of seq) {
        const k = clamp((t - acc) / d, 0, 1);
        if (a === 'right') x += k * 150; if (a === 'left') x -= k * 150;
        if (a === 'up') y -= k * 60; if (a === 'down') y += k * 60;
        if (a === 'dash') x += k * 300 - (k > 0.99 ? 300 : 0) * 0;
        if (t >= acc && t < acc + d) { act = a; local = t - acc; }
        acc += d;
      }
      if (act === 'dash') x = 220 + clamp((t - 5.8) / 2.2, 0, 1) * 300;
      else if (t > 8) x = 520;
      const walking = act !== 'idle';
      const lit = act === 'dash' ? (local < 0.12 || (local > 0.24 && local < 1.9) ? ['right'] : []) : walking ? [act] : [];
      return { x: act === 'dash' || t > 8 ? x : x, y, face: act === 'left' ? -1 : 1, f: walking ? [1, 2, 3, 2][Math.floor(t * (act === 'dash' ? 14 : 8)) % 4] : 0, ghost: act === 'dash', lit, note: act === 'dash' ? 'CORSA!' : '' };
    },
  },
  {
    title: 'COMBO DI PUGNI', cap: (k) => `${k.punch} ${k.punch} ${k.punch}: DUE PUGNI E UN COLPO FINALE CON LA TUA ARMA`,
    run(t) {
      const beats = [1.0, 1.35, 1.7];
      let f = 0, lit = [], weapon = null, enemy = { f: 0, x: 520, rot: 0, hit: 0 };
      beats.forEach((b, i) => {
        if (t > b && t < b + 0.3) { f = t < b + 0.06 ? 4 : 5; lit = ['punch']; if (i === 2) weapon = clamp(-1.5 + (t - b - 0.06) / 0.12 * 1.7, -1.5, 0.2); }
        if (t > b + 0.08 && t < b + 0.4) enemy.hit = i + 1;
      });
      if (enemy.hit && enemy.hit < 3) enemy.f = 7;
      if (t > 1.8) { const k = clamp((t - 1.8) / 0.5, 0, 1); enemy.x = 520 + k * 150; enemy.rot = -k * 1.5; enemy.z = Math.sin(k * Math.PI) * 60; enemy.f = 7; }
      if (t > 3.8) { enemy.rot = -1.5 * clamp(1 - (t - 3.8) / 0.4, 0, 1); enemy.f = t > 4.2 ? 0 : 4; enemy.x = 670 - clamp((t - 4.2) / 1, 0, 1) * 150; }
      return { x: 420, y: 580, face: 1, f, lit, weapon, enemy, note: t > 1.7 && t < 2.6 ? 'COLPO FINALE!' : '' };
    },
  },
  {
    title: 'CALCIO E SALTO', cap: (k) => `${k.kick}: CALCIO POTENTE · ${k.jump} + ${k.kick}: CALCIO VOLANTE`,
    run(t) {
      let f = 0, lit = [], z = 0, x = 420, enemy = { f: 0, x: 560 };
      if (t > 0.8 && t < 1.3) { f = t < 0.92 ? 4 : 6; lit = ['kick']; }
      if (t > 1.0 && t < 1.5) enemy.f = 7;
      if (t > 3 && t < 4.2) {
        const k = (t - 3) / 1.2; z = Math.sin(k * Math.PI) * 150; x = 360 + k * 120; f = t > 3.45 ? 6 : 4;
        lit = t < 3.15 ? ['jump'] : t > 3.45 && t < 3.6 ? ['kick'] : [];
        if (t > 3.6) { enemy.f = 7; enemy.rot = -clamp((t - 3.6) * 4, 0, 1.5); enemy.x = 560 + (t - 3.6) * 200; }
      }
      if (t >= 4.2) { x = 480; enemy.f = 7; enemy.rot = -1.5; enemy.x = 680; if (t > 5.5) { enemy.rot = 0; enemy.f = 0; enemy.x = 560; } }
      return { x, y: 580, z, face: 1, f, lit, enemy, note: t > 3.4 && t < 4.2 ? 'VOLANTE!' : '' };
    },
  },
  {
    title: 'PRESA E LANCIO', cap: (k) => `CAMMINA CONTRO UN NEMICO STORDITO · ${k.punch}: GINOCCHIATA · ${k.kick}: LANCIALO CONTRO GLI ALTRI`,
    run(t) {
      let f = 0, lit = [], x = 360, enemy = { f: 7, x: 520 }, enemy2 = { f: 0, x: 780 };
      if (t < 1.4) { x = 360 + t * 70; f = [1, 2, 3, 2][Math.floor(t * 8) % 4]; lit = ['right']; }
      else x = 458;
      if (t >= 1.4) { enemy.x = x + 52; enemy.face = -1; f = 4; }
      [2.0, 2.6].forEach((b) => { if (t > b && t < b + 0.26) { f = t > b + 0.08 ? 6 : 4; lit = ['punch']; } });
      if (t > 3.3) {
        const k = clamp((t - 3.3) / 0.7, 0, 1);
        f = t < 3.6 ? 5 : 0; if (t < 3.45) lit = ['kick'];
        enemy.x = x + 52 + k * 280; enemy.z = Math.sin(k * Math.PI) * 80; enemy.rot = -k * 1.5;
        if (k >= 1) { enemy2.f = 7; enemy2.rot = -clamp((t - 4) * 4, 0, 1.5); enemy2.x = 780 + clamp((t - 4) * 150, 0, 60); }
      }
      return { x, y: 580, face: 1, f, lit, enemy, enemy2, note: t > 1.4 && t < 3.3 ? 'PRESO!' : t > 3.4 && t < 4.6 ? 'LANCIO!' : '' };
    },
  },
  {
    title: 'MOSSA SPECIALE', cap: (k) => `${k.special}: MOSSA SPECIALE CON L'ARMA · COSTA 40 DI ENERGIA (BARRA BLU)`,
    run(t, loop) {
      const hero = loop % 5;
      let f = 0, lit = [], weapon = null, fx = null, en = 100;
      if (t > 1 && t < 2.4) {
        const k = t - 1;
        lit = k < 0.2 ? ['special'] : []; en = 60;
        const id = HEROES[hero].id;
        f = id === 'onyx' ? (k < 0.3 ? 4 : 5) : id === 'lyra' ? (Math.floor(k / 0.08) % 2 ? 5 : 6) : k < 0.18 ? 4 : 5;
        weapon = id === 'ignis' ? k * 20 : id === 'onyx' ? (k < 0.3 ? -2.0 : 0.95) : 0;
        fx = { id, k };
      } else if (t >= 2.4) en = 60;
      return { hero, x: 440, y: 580, face: 1, f, lit, weapon, fx, en, note: t > 1 && t < 2.6 ? HEROES[hero].special : '', enemy: { f: t > 1.2 && t < 2.6 ? 7 : 0, x: 620, rot: t > 1.3 && t < 2.6 ? -1.4 : 0 } };
    },
  },
  {
    title: 'SCHIVATA E OGGETTI', cap: (k) => `${k.dodge}: SCHIVATA · ROMPI LE CASSE: DENTRO CI SONO CIBO ED ENERGIA`,
    run(t) {
      let f = 0, lit = [], x = 440, ghost = false, enemy = { f: 0, x: 560 }, crate = true, food = null;
      if (t > 0.7 && t < 1.2) enemy.f = t < 0.95 ? 4 : 5;
      if (t > 0.85 && t < 1.15) { ghost = true; lit = ['dodge']; x = 440 - (t - 0.85) * 400; f = 1; }
      if (t >= 1.15) x = 320;
      if (t > 3 && t < 3.3) { f = t < 3.06 ? 4 : 5; lit = ['punch']; }
      if (t > 3.8 && t < 4.1) { f = t < 3.86 ? 4 : 5; lit = ['punch']; }
      if (t > 3.95) { crate = false; food = { x: 250, z: Math.max(0, Math.sin(clamp((t - 3.95) / 0.5, 0, 1) * Math.PI) * 50) }; }
      if (t > 5) { const k = clamp((t - 5) / 0.8, 0, 1); x = 320 - k * 70; f = k < 1 ? [1, 2, 3, 2][Math.floor(t * 8) % 4] : 0; lit = k < 1 ? ['left'] : []; }
      if (t > 5.8) food = null;
      return { x, y: 580, face: t > 2.5 && t < 5 ? -1 : t >= 5 ? -1 : 1, f, lit, ghost, enemy, crate, food, note: t > 0.85 && t < 1.6 ? 'SCHIVATA!' : t > 5.8 && t < 7 ? '+30 VITA' : '' };
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
    title: 'DUELLI TRA GIGANTI', cap: (k) => `TIENI ${k.dodge}: PARATA · ${k.punch}/${k.kick}: ATTACCA · SBILANCIA IL MOSTRO E PREMI ${k.special}: ARMA FINALE`,
    run(t) {
      let lit = [], guard = false, px = 380, beam = 0, stagger = false;
      if (t > 0.6 && t < 1.6) { guard = true; lit = ['dodge']; }
      [2.2, 2.6, 3.0, 3.4].forEach((b) => { if (t > b && t < b + 0.3) { lit = [b === 3.4 ? 'kick' : 'punch']; px = 380 + Math.sin((t - b) / 0.3 * Math.PI) * 40; } });
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
  drawKey(bx + 66, y + 62, k.kick, L('kick'), color);
  drawKey(bx + 132, y + 62, k.special, L('special'), color);
  lab('PUGNO', bx + 29, y + 136); lab('CALCIO', bx + 95, y + 136); lab('SPECIALE', bx + 161, y + 136);
  // bottom row
  drawKey(x, y + 160, k.dodge, L('dodge'), color, 124);
  drawKey(x + 150, y + 160, k.jump, L('jump'), color, 280);
  lab('SCHIVATA', x + 62, y + 236); lab('SALTO', x + 290, y + 236);
  if (scheme === 'kb2') ptxt('2P: FRECCE · K PUGNO · L CALCIO · I SALTO · O SPECIALE · P SQUADRA', x + 215, y + 272, 8, '#ffcf7a', 'center');
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
  fb(cx, cy - 44, 'Y', '#f2c230', L('kick'));
  fb(cx - 44, cy, 'X', '#3f86ff', L('punch'));
  fb(cx + 44, cy, 'B', '#ff4a3d', L('special'));
  fb(cx, cy + 44, 'A', '#58e0a0', L('jump'));
  g.restore();
  const lab = (t, xx, yy) => ptxt(t, xx, yy, 8, '#dfe8f0', 'center');
  lab('MUOVI', dx, y + 250); lab('SQUADRA', x + 95, y - 12); lab('SCHIVATA', x + 365, y - 12);
  lab('X PUGNO · Y CALCIO', cx, y + 250); lab('A SALTO · B SPECIALE', cx, y + 266);
}
function roundRect(x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* ---------- drawing the demo stage ---------- */
function puppet(heroIdx, s) {
  const id = HEROES[heroIdx].id;
  const key = `${id}_${s.f || 0}`;
  const z = s.z || 0;
  drawShadow(s.x, s.y, 36, z);
  if (s.ghost) for (let i = 2; i >= 1; i--) spr('fighters', key, s.x - s.face * i * 24, s.y - z, { scale: 1.0, face: s.face, alpha: 0.2 * (3 - i) });
  spr('fighters', key, s.x, s.y - z, { scale: 1.0, face: s.face });
  if (s.weapon !== null && s.weapon !== undefined) drawSigWeapon('w_' + id, key, s.x, s.y - z, s.face, 1.0, s.weapon, HEROES[heroIdx].glow, Game.howT || 0);
}
function enemyPuppet(e, y = 580, key = 'soldier') {
  if (!e) return;
  const z = e.z || 0;
  drawShadow(e.x, y, 36, z);
  spr('fighters', `${key}_${e.f || 0}`, e.x + (e.rot ? -10 : 0), y - z, { scale: 1.0, face: e.face || -1, rot: e.rot || 0 });
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
  const cap = P.cap(ACT_KEYS[scheme]);
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
  if (id === 'ignis' && k > 0.18) { g.strokeStyle = '#ff7a3a'; g.lineWidth = 10 * (1 - k / 1.4); g.globalAlpha = 1 - k / 1.4; g.beginPath(); g.ellipse(s.x, s.y - 60, 60 + k * 200, 20 + k * 70, 0, 0, 7); g.stroke(); }
  if (id === 'azur' && k < 0.6) { g.fillStyle = '#8cc4ff'; g.globalAlpha = 0.5; g.fillRect(s.x - 200, s.y - 110, 200, 60); }
  if (id === 'lyra') { g.strokeStyle = '#ffe98a'; g.lineWidth = 4; g.globalAlpha = 0.9; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s.x + 90, s.y - 90 + i * 16, 36, -1.2 + k * 8, 0.6 + k * 8); g.stroke(); } }
  if (id === 'aura' && k > 0.2) { const x = s.x + 60 + (k - 0.2) * 700; g.fillStyle = '#ff78bb'; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(x - 40, s.y - 170); g.quadraticCurveTo(x + 60, s.y - 80, x - 40, s.y + 10); g.quadraticCurveTo(x + 10, s.y - 80, x - 40, s.y - 170); g.fill(); }
  if (id === 'onyx' && k > 0.3) { g.strokeStyle = '#e3ecf5'; g.lineWidth = 8; g.globalAlpha = 1.3 - k; g.beginPath(); g.ellipse(s.x + 50, s.y, 40 + (k - 0.3) * 300, 12 + (k - 0.3) * 90, 0, 0, 7); g.stroke(); }
  g.restore();
}
