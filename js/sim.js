'use strict';
/* ============================================================
   SIMULAZIONE — gira sull'host (o in locale). Produce "view"
   serializzabili che il renderer e i client online disegnano.
   ============================================================ */
const HERO_SCALE = 0.86;
let NEXT_ID = 1;
const nid = () => NEXT_ID++;

function newStage(levelIdx, players, checkpoint = 0) {
  const L = LEVELS[levelIdx];
  const S = {
    lvl: levelIdx, L, phase: 'stage', t: 0, cam: 0, camLock: null, zoneIdx: checkpoint, zoneOn: false, wave: 0,
    players: [], enemies: [], props: [], items: [], shots: [], civs: [], events: [], team: 0,
    banner: { text: L.place, sub: `CAPITOLO ${L.n}`, t: 3 }, cleared: false, clearT: 0, bossId: 0, endT: 0,
    hitstop: 0, flashT: 0, checkpoint, ambientT: 1.5, giant: null, result: null,
  };
  const startX = checkpoint ? L.zones[checkpoint - 1].x + 420 : 200;
  players.forEach((p, i) => {
    const hero = HEROES[p.hero];
    S.players.push({
      id: p.id, slot: i, hero: p.hero, name: p.name || `G${i + 1}`,
      x: startX - i * 60, y: 560 + i * 36, z: 0, vz: 0, vx: 0, face: 1,
      hp: hero.hp, max: hero.hp, en: 60, lives: p.lives ?? 3, score: p.score || 0,
      st: 'idle', t: 0, atk: null, hit: new Set(), combo: 0, comboT: 0, inv: 1.5, weapon: null,
      tapT: 0, tapDir: 0, run: false, hold: 0, holdN: 0, walk: 0, respawn: 0, out: false, kos: 0, maxCombo: 0, hits: 0,
    });
  });
  S.cam = clamp(startX - 380, 0, L.length - W);
  if (levelIdx === 0 && !checkpoint) {
    S.phase = 'morph';
    S.players.forEach((p) => { p.civil = true; p.inv = 0; });
    S.banner = { text: 'PREMI SPECIALE PER TRASFORMARTI', sub: 'LA PRIMA TRASFORMAZIONE', t: 12 };
  }
  // props & weapons
  for (const z of L.zones) for (const [type, x, y] of z.p || []) S.props.push({ id: nid(), type, x, y, hp: PROPS[type].hp, shake: 0 });
  for (const [type, x, y] of L.weapons || []) S.items.push(makeItem(type, x, y));
  // intro ambience: civilians fleeing across the street
  if (!checkpoint) for (let i = 0; i < 5; i++) S.civs.push(makeCiv(pick(CIVS), S.cam + W + 60 + i * 110, 505 + (i * 37) % 170, 'flee'));
  return S;
}

function makeItem(type, x, y, z = 0) {
  return { id: nid(), type, x, y, z, vz: z ? 0 : 0, life: ITEMS[type].weapon ? 999 : 18, bob: Math.random() * 6 };
}
function makeCiv(type, x, y, mode) {
  return { id: nid(), type, x, y, face: -1, mode, t: Math.random(), speed: rand(170, 230), said: false };
}

/* ---------------- events ---------------- */
function ev(S, e) { S.events.push(e); }
function sparks(S, x, y, c, n = 10, kind = 'spark') { ev(S, { t: kind, x: Math.round(x), y: Math.round(y), c, n }); }
function sfx(S, n) { ev(S, { t: 'snd', n }); }
function floatText(S, x, y, s, c = '#fff1c6', size = 22) { ev(S, { t: 'txt', x: Math.round(x), y: Math.round(y), s, c, size }); }
function shake(S, v) { ev(S, { t: 'shake', v }); }
function ring(S, x, y, c, r = 220, life = 0.5) { ev(S, { t: 'ring', x: Math.round(x), y: Math.round(y), c, r, life }); }

/* ---------------- moves ---------------- */
const MOVES = {
  jab: { dur: 0.24, hitAt: 0.07, frames: [[0.06, 4], [1, 5]], dmg: 9, reach: 104, depth: 36, snd: 'punch' },
  jab2: { dur: 0.25, hitAt: 0.07, frames: [[0.05, 4], [1, 5]], dmg: 10, reach: 108, depth: 36, snd: 'punch' },
  fin: { dur: 0.44, hitAt: 0.13, frames: [[0.08, 4], [1, 6]], dmg: 17, reach: 132, depth: 40, knock: true, snd: 'kick', lunge: 120 },
  kick: { dur: 0.5, hitAt: 0.17, frames: [[0.12, 4], [1, 6]], dmg: 16, reach: 136, depth: 40, knock: true, snd: 'kick', lunge: 60 },
  air: { dur: 9, hitAt: 0, frames: [[99, 6]], dmg: 15, reach: 120, depth: 44, knock: true, snd: 'kick', air: true },
  dash: { dur: 0.38, hitAt: 0.05, frames: [[1, 5]], dmg: 16, reach: 110, depth: 42, knock: true, snd: 'punch', lunge: 420, multi: true },
  knee: { dur: 0.26, hitAt: 0.1, frames: [[0.08, 4], [1, 6]], dmg: 8, reach: 70, depth: 30, snd: 'kick', grab: true },
  swing: { dur: 0.34, hitAt: 0.11, frames: [[0.1, 4], [1, 5]], dmg: 11, reach: 104, depth: 42, snd: 'weapon', weapon: true },
};

function heroOf(p) { return HEROES[p.hero]; }

function startMove(S, p, name) {
  const m = MOVES[name];
  p.st = 'atk'; p.t = 0; p.atk = name; p.hit = new Set();
  if (m.snd) sfx(S, m.snd);
}

/* =========================================================
   STEP
   ========================================================= */
function stepStage(S, ctrls, dt) {
  S.events.length = 0;
  if (S.hitstop > 0) { S.hitstop -= dt; return; }
  S.t += dt;
  const L = S.L;
  if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }

  for (const p of S.players) stepPlayer(S, p, ctrls[p.id] || EMPTY_CTRL, dt);
  if (S.phase === 'morph' && S.players.every((p) => !p.civil)) { S.phase = 'stage'; S.banner = { text: L.place, sub: `CAPITOLO ${L.n} · ${L.title}`, t: 2.6 }; }
  tickCounters(S, dt);
  stepTeam(S, dt);
  if (!S.teamT) for (const e of S.enemies) stepEnemy(S, e, dt);
  S.enemies = S.enemies.filter((e) => !(e.st === 'dead' && e.t > 1.1));
  stepShots(S, dt);
  stepItems(S, dt);
  stepCivs(S, dt);
  stepZones(S, dt);
  stepCamera(S, dt);

  // team meter decays very slowly when nothing happens
  S.team = clamp(S.team, 0, 100);
  for (const pr of S.props) pr.shake = Math.max(0, pr.shake - dt);
}
const EMPTY_CTRL = { l: 0, r: 0, u: 0, d: 0, held: {}, pressed: {} };

function alivePlayers(S) { return S.players.filter((p) => !p.out && p.st !== 'dead'); }

/* ---------------- player ---------------- */
function stepPlayer(S, p, c, dt) {
  const hero = heroOf(p);
  p.t += dt;
  p.inv = Math.max(0, p.inv - dt);
  p.comboT = Math.max(0, p.comboT - dt);
  p.tapT = Math.max(0, p.tapT - dt);
  if (!S.L.noRegen) p.en = Math.min(100, p.en + dt * 1.8);

  if (p.out) {
    // continue: press start/punch to jump back in
    if (c.pressed.start || c.pressed.punch) {
      p.out = false; p.lives = 3; p.score = Math.floor(p.score / 2); p.hp = p.max; p.st = 'drop'; p.t = 0;
      p.x = S.cam + 200; p.y = 580; p.z = 500; p.vz = 0; p.inv = 2.5;
      floatText(S, p.x, p.y - 200, 'CONTINUA!', hero.color, 28);
    }
    return;
  }
  if (p.st === 'dead') {
    if (p.t > 1.6) {
      if (p.lives > 0) {
        p.st = 'drop'; p.t = 0; p.hp = p.max; p.en = Math.max(p.en, 50); p.inv = 3;
        p.x = clamp(p.x, S.cam + 120, S.cam + W - 120); p.z = 520; p.vz = 0; p.weapon = null;
      } else { p.out = true; }
    }
    return;
  }

  const dx = (c.r ? 1 : 0) - (c.l ? 1 : 0), dy = (c.d ? 1 : 0) - (c.u ? 1 : 0);
  if (p.civil) {
    // chapter 1 opening: civilian clothes, the first transformation is played by the player
    if (p.morphT > 0) {
      p.morphT -= dt;
      if (p.morphT <= 0) {
        p.civil = false; p.st = 'idle'; p.t = 0; p.inv = 1.2;
        ev(S, { t: 'flash', c: hero.glow, v: 0.5 }); ring(S, p.x, p.y, hero.color, 260, 0.6); sparks(S, p.x, p.y - 80, hero.glow, 30, 'fire');
        floatText(S, p.x, p.y - 190, hero.name + '!', hero.color, 30);
      }
      return;
    }
    const len = Math.hypot(dx, dy) || 1;
    p.x += (dx / len) * hero.speed * 0.8 * dt; p.y += (dy / len) * hero.speed * 0.5 * dt;
    if (dx) p.face = dx;
    p.st = dx || dy ? 'walk' : 'idle'; if (dx || dy) p.walk += dt * 9;
    p.x = clamp(p.x, S.cam + 40, S.cam + W - 40); p.y = clamp(p.y, FLOOR_TOP, FLOOR_BOTTOM);
    if (c.pressed.special || c.pressed.team || S.t > 12 + p.slot * 0.4) {
      p.morphT = 1.0; p.st = 'idle'; p.face = 1;
      sfx(S, 'morph'); ev(S, { t: 'morph', x: Math.round(p.x), y: Math.round(p.y), c: hero.color });
    }
    return;
  }
  const free = p.st === 'idle' || p.st === 'walk';

  // double-tap to run
  if (free && c.pressed && (c.l || c.r)) {
    const dir = dx;
    if (dir && !p._prevDir) {
      if (p.tapT > 0 && p.tapDir === dir) p.run = true;
      p.tapT = 0.28; p.tapDir = dir;
    }
  }
  if (!dx) p.run = false;
  p._prevDir = dx;

  switch (p.st) {
    case 'idle': case 'walk': {
      // pick up weapon
      if (c.pressed.punch && !p.weapon) {
        const it = S.items.find((i) => ITEMS[i.type].weapon && i.z <= 0 && Math.abs(i.x - p.x) < 55 && Math.abs(i.y - p.y) < 34);
        if (it) {
          p.weapon = { type: it.type, uses: ITEMS[it.type].uses }; it.life = 0;
          sfx(S, 'weapon'); floatText(S, p.x, p.y - 170, ITEMS[it.type].label, '#e8f2ff', 18);
          p.st = 'atk'; p.atk = 'pickup'; p.t = 0; p.hit = new Set();
          break;
        }
      }
      // grab: walking into a hurt/idle enemy
      if (dx && !p.run) {
        const e = S.enemies.find((e) => !e.boss && !e.big && ['hurt', 'walk', 'idle'].includes(e.st) && e.z === 0 &&
          Math.abs(e.y - p.y) < 22 && (e.x - p.x) * dx > 0 && Math.abs(e.x - p.x) < 64);
        p.pushT = e ? (p.pushT || 0) + dt : 0;
        if (e && (e.st === 'hurt' || p.pushT > 0.3)) { p.pushT = 0; grab(S, p, e); break; }
      } else p.pushT = 0;
      if (c.pressed.team && S.team >= 100) { teamAttack(S, p); break; }
      if (c.pressed.special) { special(S, p); break; }
      if (c.pressed.jump) { p.st = 'jump'; p.t = 0; p.vz = 560; p.jdx = dx * (p.run ? 1.35 : 1); p.jdy = dy; sfx(S, 'jump'); break; }
      if (c.pressed.dodge) { p.st = 'dodge'; p.t = 0; p.inv = 0.38; p.ddir = dx || -p.face; sfx(S, 'dodge'); break; }
      if (c.pressed.punch) {
        if (p.weapon) { startMove(S, p, 'swing'); break; }
        if (p.run) { startMove(S, p, 'dash'); p.run = false; break; }
        const name = p.comboT > 0 ? (p.combo === 1 ? 'jab2' : p.combo >= 2 ? 'fin' : 'jab') : 'jab';
        p.combo = name === 'jab' ? 1 : name === 'jab2' ? 2 : 0;
        startMove(S, p, name);
        break;
      }
      if (c.pressed.kick) { startMove(S, p, 'kick'); p.combo = 0; break; }
      // movement
      const sp = hero.speed * (p.run ? 1.55 : 1);
      const len = Math.hypot(dx, dy) || 1;
      p.x += (dx / len) * sp * dt;
      p.y += (dy / len) * sp * 0.62 * dt;
      if (dx) p.face = dx;
      p.st = dx || dy ? 'walk' : 'idle';
      if (dx || dy) p.walk += dt * (p.run ? 13 : 8.5);
      break;
    }
    case 'jump': {
      p.z += p.vz * dt; p.vz -= 1500 * dt;
      p.x += p.jdx * hero.speed * 1.05 * dt;
      p.y += p.jdy * hero.speed * 0.4 * dt;
      if ((c.pressed.punch || c.pressed.kick) && !p.airDone) { p.airDone = true; p.atk = 'air'; p.hit = new Set(); sfx(S, 'kick'); }
      if (p.atk === 'air') hitScan(S, p, MOVES.air);
      if (p.z <= 0) { p.z = 0; p.vz = 0; p.st = 'land'; p.t = 0; p.atk = null; p.airDone = false; }
      break;
    }
    case 'land': if (p.t > 0.08) p.st = 'idle'; break;
    case 'drop': {
      p.z = Math.max(0, p.z - 900 * dt);
      if (p.z === 0) { p.st = 'land'; p.t = 0; ring(S, p.x, p.y, hero.color, 160, 0.4); shake(S, 4); }
      break;
    }
    case 'dodge': {
      p.x += p.ddir * 620 * dt * (1 - p.t / 0.3);
      if (p.t > 0.3) p.st = 'idle';
      break;
    }
    case 'atk': {
      if (p.atk === 'pickup') { if (p.t > 0.18) p.st = 'idle'; break; }
      const m = MOVES[p.atk];
      if (m.lunge && p.t < m.dur * 0.6) p.x += p.face * m.lunge * dt * (p.atk === 'dash' ? 1 : 2.2 * (1 - p.t / m.dur));
      if (p.t >= m.hitAt && (m.multi ? p.t < m.dur * 0.8 : !p._swung)) { hitScan(S, p, m); if (!m.multi) p._swung = true; }
      // buffered combo input
      if (c.pressed.punch && p.t > m.hitAt) p.buffer = 'punch';
      if (c.pressed.kick && p.t > m.hitAt) p.buffer = 'kick';
      if (p.t >= m.dur) {
        p._swung = false; p.st = 'idle'; p.t = 0;
        if (['jab', 'jab2'].includes(p.atk)) p.comboT = 0.45; else p.combo = 0;
        if (p.buffer === 'punch' && p.comboT > 0 && !p.weapon) {
          const name = p.combo === 1 ? 'jab2' : 'fin';
          p.combo = name === 'jab2' ? 2 : 0; startMove(S, p, name);
        } else if (p.buffer === 'kick') startMove(S, p, 'kick');
        p.buffer = null;
      }
      break;
    }
    case 'grab': {
      const e = S.enemies.find((e) => e.id === p.hold);
      if (!e || e.st !== 'held') { p.st = 'idle'; p.hold = 0; break; }
      e.x = p.x + p.face * 52; e.y = p.y + 1; e.face = -p.face;
      if (dx && dx !== p.face) p.face = dx, e.x = p.x + p.face * 52, e.face = -p.face;
      if (c.pressed.punch) {
        startMove(S, p, 'knee'); p.st = 'grabatk'; p.holdN++;
      } else if (c.pressed.kick || c.pressed.jump || p.t > 2.2) {
        throwEnemy(S, p, e);
      }
      break;
    }
    case 'grabatk': {
      const e = S.enemies.find((e) => e.id === p.hold);
      if (!e) { p.st = 'idle'; break; }
      e.x = p.x + p.face * 52; e.y = p.y + 1;
      if (p.t > 0.1 && !p._swung) {
        p._swung = true;
        damageEnemy(S, p, e, 8 * heroOf(p).power, { noKnock: true, keepHeld: true });
      }
      if (p.t > 0.26) {
        p._swung = false; p.st = 'grab'; p.t = 0;
        if (p.holdN >= 3 && e.hp > 0) throwEnemy(S, p, e);
        if (e.hp <= 0) { p.st = 'idle'; p.hold = 0; }
      }
      break;
    }
    case 'throw': if (p.t > 0.3) p.st = 'idle'; break;
    case 'special': stepSpecial(S, p, dt); break;
    case 'pose': {
      if (p.t > 1.25) p.st = 'idle';
      break;
    }
    case 'hurt': if (p.t > 0.32) p.st = 'idle'; break;
    case 'knock': {
      p.x += p.vx * dt; p.vx *= 0.96;
      p.z += p.vz * dt; p.vz -= 1600 * dt;
      if (p.z <= 0 && p.t > 0.1) { p.z = 0; p.st = p.hp > 0 ? 'down' : 'dead'; p.t = 0; shake(S, 3); sfx(S, 'heavy'); if (p.hp <= 0) { p.lives--; sfx(S, 'ko'); } }
      break;
    }
    case 'down': if (p.t > 0.7) { p.st = 'getup'; p.t = 0; } break;
    case 'getup': if (p.t > 0.3) { p.st = 'idle'; p.inv = 1.1; } break;
  }
  // bounds
  const lo = S.cam + 40, hi = S.camLock !== null ? S.camLock + W - 40 : Math.min(S.L.length - 40, S.cam + W - 40);
  p.x = clamp(p.x, lo, hi);
  p.y = clamp(p.y, FOOT_TOP(), FLOOR_BOTTOM);

  // pickups (consumables are automatic)
  for (const it of S.items) {
    const d = ITEMS[it.type];
    if (d.weapon || it.life <= 0 || it.z > 20) continue;
    if (Math.abs(it.x - p.x) < 46 && Math.abs(it.y - p.y) < 30) {
      it.life = 0;
      if (d.heal) { p.hp = Math.min(p.max, p.hp + d.heal); floatText(S, p.x, p.y - 170, `+${d.heal}`, '#7bf0b1'); }
      if (d.energy) { p.en = Math.min(100, p.en + d.energy); floatText(S, p.x, p.y - 170, 'ENERGIA', '#77ceff'); }
      if (d.score) { p.score += d.score; floatText(S, p.x, p.y - 170, `+${d.score}`, '#ffd76a'); }
      if (d.team) S.team = Math.min(100, S.team + d.team);
      sfx(S, 'pickup');
    }
  }
}
function FOOT_TOP() { return FLOOR_TOP; }

function grab(S, p, e) {
  p.st = 'grab'; p.t = 0; p.hold = e.id; p.holdN = 0;
  e.st = 'held'; e.t = 0; e.holder = p.id;
  sfx(S, 'punch');
}
function throwEnemy(S, p, e) {
  e.st = 'thrown'; e.t = 0; e.vx = p.face * 560; e.vz = 330; e.z = 30; e.thrower = p.id; e.face = -p.face;
  p.st = 'throw'; p.t = 0; p.hold = 0;
  damageEnemy(S, p, e, 10 * heroOf(p).power, { noKnock: true, keepHeld: true, silent: true });
  sfx(S, 'heavy');
}

function hitScan(S, p, m) {
  const hero = heroOf(p);
  let reach = m.reach, dmg = m.dmg * hero.power, depth = m.depth;
  if (m.weapon && p.weapon) { reach += ITEMS[p.weapon.type].reach; dmg *= ITEMS[p.weapon.type].dmg; }
  let landed = false;
  for (const e of S.enemies) {
    if (p.hit.has(e.id) || !hittable(e)) continue;
    const rx = (e.x - p.x) * p.face;
    const w = e.boss || e.big ? 60 : 0;
    if (rx > -25 && rx < reach + w && Math.abs(e.y - p.y) < depth + (e.boss ? 18 : 0) && Math.abs((e.z || 0) - p.z) < 90) {
      p.hit.add(e.id);
      landed = true;
      damageEnemy(S, p, e, dmg, { knock: m.knock || (m.air && true), heavy: m.knock });
    }
  }
  for (const o of S.props) {
    if (o.hp <= 0 || p.hit.has(o.id)) continue;
    const rx = (o.x - p.x) * p.face;
    if (rx > -20 && rx < reach + 10 && Math.abs(o.y - p.y) < 40) { p.hit.add(o.id); hitProp(S, o, p); landed = true; }
  }
  if (landed && m.weapon && p.weapon) {
    p.weapon.uses--;
    if (p.weapon.uses <= 0) { floatText(S, p.x, p.y - 170, 'ARMA ROTTA', '#c0c8d0', 16); sparks(S, p.x + p.face * 60, p.y - 90, '#c8d2dc', 14); p.weapon = null; }
  }
}
function hittable(e) { return e.hp > 0 && !['dead', 'down', 'thrown', 'held', 'burrow', 'gone'].includes(e.st) && !(e.st === 'knock' && e.t > 0.05) && e.inv <= 0; }

function hitProp(S, o, who) {
  o.hp--; o.shake = 0.2;
  sparks(S, o.x, o.y - 30, '#d9a66b', 8, 'chip');
  sfx(S, 'break');
  if (o.hp > 0) return;
  const def = PROPS[o.type];
  if (who && who.score !== undefined) who.score += 100;
  if (o.type === 'crate' || o.type === 'bin') ev(S, { t: 'debris', x: o.x, y: o.y, k: o.type });
  if (def.explode) {
    ev(S, { t: 'boom', x: o.x, y: o.y - 30 }); sfx(S, 'boom'); shake(S, 14); S.hitstop = 0.05;
    for (const e of S.enemies) if (hittable(e) && Math.hypot(e.x - o.x, (e.y - o.y) * 1.6) < 190) damageEnemy(S, who, e, e.boss ? 45 : 60, { knock: true, heavy: true, from: o.x });
    for (const p of S.players) if (Math.hypot(p.x - o.x, (p.y - o.y) * 1.6) < 150 && p.inv <= 0 && p.st !== 'dead') hurtPlayer(S, p, 12, { knock: true, from: o.x });
    for (const q of S.props) if (q !== o && q.hp > 0 && Math.hypot(q.x - o.x, q.y - o.y) < 170) hitProp(S, q, who);
  }
  const drops = def.drops;
  if (drops.length) {
    // a guaranteed useful drop, weighted by need
    const lowHp = S.players.some((p) => p.hp < p.max * 0.5);
    let type = lowHp && Math.random() < 0.6 ? (Math.random() < 0.35 ? 'chicken' : 'pizza') : pick(drops);
    const it = makeItem(type, o.x, o.y, 30); it.vz = 260; S.items.push(it);
  }
}

function damageEnemy(S, p, e, dmg, opt = {}) {
  if (e.guarding && !opt.unblockable && p && (p.x - e.x) * e.face > 0 && Math.random() < 0.75) {
    sparks(S, e.x + e.face * 40, e.y - 120, '#e8f4ff', 12); sfx(S, 'weapon'); floatText(S, e.x, e.y - 230, 'PARATA', '#e8f4ff', 16);
    if (p && p.x !== undefined) p.x -= p.face * 30;
    return;
  }
  dmg = Math.round(dmg);
  e.hp -= dmg;
  e.flash = 0.08;
  if (p && p.score !== undefined) {
    p.score += dmg * 10; p.hits++;
    p.combo2 = (p.comboHitT > 0 ? (p.combo2 || 0) + 1 : 1); p.comboHitT = 1.4; p.maxCombo = Math.max(p.maxCombo, p.combo2);
    p.en = Math.min(100, p.en + (S.L.noRegen ? 2 : 4));
    S.team = Math.min(100, S.team + dmg * 0.18);
  }
  const col = e.boss ? '#ffc052' : e.def && e.def.shade ? '#c79bff' : '#a58cff';
  sparks(S, e.x + (p ? -p.face * 10 : 0), e.y - (e.boss ? 150 : 95) - (e.z || 0), col, e.boss ? 14 : 10);
  if (!opt.silent) sfx(S, opt.heavy ? 'heavy' : 'hit');
  shake(S, opt.heavy ? 6 : 3);
  S.hitstop = opt.heavy ? 0.07 : 0.035;
  const from = opt.from !== undefined ? opt.from : p ? p.x : e.x - e.face;
  const dir = e.x >= from ? 1 : -1;
  if (e.boss) {
    e.poise = (e.poise || 0) + dmg;
    if (e.poise > (e.big ? 999 : 70) && !['atk', 'dash', 'teleport', 'burrow'].includes(e.st)) { e.poise = 0; e.st = 'hurt'; e.t = 0; }
    if (e.hp <= 0) killBoss(S, e, p);
    return;
  }
  if (opt.keepHeld && e.st === 'held' && e.hp > 0) return;
  if (e.hp <= 0 || opt.knock) {
    e.st = 'knock'; e.t = 0; e.vx = dir * (opt.heavy ? 380 : 300); e.vz = 380; e.z = Math.max(e.z || 0, 1); e.face = -dir;
    if (e.holder) { const h = S.players.find((q) => q.id === e.holder); if (h && h.hold === e.id) { h.hold = 0; h.st = 'idle'; } e.holder = 0; }
  } else if (!opt.noKnock) {
    e.st = 'hurt'; e.t = 0; e.x += dir * 16; e.face = -dir;
  }
  if (e.hp <= 0) {
    e.killer = p ? p.id : 0;
    if (p && p.score !== undefined) { p.score += e.def.score; p.kos++; }
    // drops: every few KOs something useful
    S.koCount = (S.koCount || 0) + 1;
    if (S.koCount % 4 === 0) { const it = makeItem(pick(['energy', 'coin', 'can', 'pizza']), e.x, e.y, 40); it.vz = 220; S.items.push(it); }
    if (S.koCount % 9 === 0) { const it = makeItem('gem', e.x + 20, e.y, 40); it.vz = 260; S.items.push(it); }
  }
}

function hurtPlayer(S, p, dmg, opt = {}) {
  if (p.inv > 0 || p.st === 'dead' || p.out || p.st === 'down' || p.st === 'knock' || p.st === 'pose') return false;
  if (p.st === 'grab' || p.st === 'grabatk') {
    const e = S.enemies.find((e) => e.id === p.hold); if (e) { e.st = 'hurt'; e.t = 0; e.holder = 0; } p.hold = 0;
  }
  p.hp -= dmg; p.combo = 0; p.run = false; p.buffer = null;
  sparks(S, p.x, p.y - 95 - p.z, '#ff6a5e', 12);
  sfx(S, 'hurt'); shake(S, 7);
  const from = opt.from !== undefined ? opt.from : p.x - p.face;
  const dir = p.x >= from ? 1 : -1;
  if (p.hp <= 0 || opt.knock || p.z > 0) {
    p.hp = Math.max(0, p.hp);
    p.st = 'knock'; p.t = 0; p.vx = dir * 300; p.vz = 360; p.z = Math.max(p.z, 1); p.face = -dir; p.atk = null;
  } else { p.st = 'hurt'; p.t = 0; p.x += dir * 14; p.atk = null; }
  p.inv = 0.5;
  return true;
}

/* ---------------- specials ---------------- */
function special(S, p) {
  const hero = heroOf(p);
  if (p.en < 40) {
    // desperation: costs health like classic arcades
    if (p.hp > 12) { p.hp -= 8; floatText(S, p.x, p.y - 170, '-8', '#ff8a7a', 16); } else { sfx(S, 'hurt'); return; }
  } else p.en -= 40;
  p.st = 'special'; p.t = 0; p.hit = new Set(); p.inv = 0.7; p.spk = hero.id;
  sfx(S, 'special'); ev(S, { t: 'flash', c: hero.glow, v: 0.25 });
  S.hitstop = 0.06;
}
function stepSpecial(S, p, dt) {
  const hero = heroOf(p);
  const k = p.spk;
  const hitAll = (fn, dmg, knock = true) => {
    for (const e of S.enemies) if (hittable(e) && !p.hit.has(e.id) && fn(e)) { p.hit.add(e.id); damageEnemy(S, p, e, dmg * hero.power, { knock, heavy: true }); }
    for (const o of S.props) if (o.hp > 0 && !p.hit.has(o.id) && fn(o)) { p.hit.add(o.id); hitProp(S, o, p); }
  };
  if (k === 'ignis') {
    if (p.t > 0.18 && !p._s1) { p._s1 = 1; ring(S, p.x, p.y - 70, '#ff7a3a', 260, 0.55); ring(S, p.x, p.y - 70, '#ffd06a', 180, 0.4); sparks(S, p.x, p.y - 80, '#ff8a3a', 40, 'fire'); shake(S, 10); }
    if (p.t > 0.18) hitAll((e) => Math.hypot(e.x - p.x, (e.y - p.y) * 1.8) < 250, 42);
    if (p.t > 0.6) end();
  } else if (k === 'azur') {
    if (p.t < 0.45) { p.x += p.face * 820 * dt; if (Math.random() < 0.6) sparks(S, p.x - p.face * 40, p.y - 70, '#8cc4ff', 3, 'trail'); }
    hitAll((e) => Math.abs(e.x - p.x) < 95 && Math.abs(e.y - p.y) < 55, 40);
    if (p.t > 0.62) end();
  } else if (k === 'lyra') {
    const n = Math.floor(p.t / 0.08);
    if (n !== p._n && p.t < 0.72) {
      p._n = n; p.hit = new Set(); p.face = n % 2 ? -p.face : p.face;
      sparks(S, p.x + p.face * 70, p.y - 90, '#ffe98a', 6, 'slash');
      hitAll((e) => Math.abs(e.x - p.x) < 150 && Math.abs(e.y - p.y) < 50, 9, n >= 8);
    }
    if (p.t > 0.8) end();
  } else if (k === 'aura') {
    if (p.t > 0.2 && !p._s1) {
      p._s1 = 1;
      S.shots.push({ id: nid(), kind: 'wing', x: p.x + p.face * 60, y: p.y, z: 80, vx: p.face * 900, owner: p.id, life: 1.4, dmg: 38 * hero.power, hit: new Set(), friendly: true });
      sfx(S, 'laser');
    }
    if (p.t > 0.5) end();
  } else if (k === 'onyx') {
    if (p.t > 0.3 && !p._s1) { p._s1 = 1; ring(S, p.x + p.face * 40, p.y, '#e3ecf5', 320, 0.6); ev(S, { t: 'crack', x: p.x + p.face * 40, y: p.y }); shake(S, 16); sfx(S, 'stomp'); }
    if (p.t > 0.3) hitAll((e) => Math.hypot(e.x - p.x, (e.y - p.y) * 1.6) < 300, 48);
    if (p.t > 0.7) end();
  }
  function end() { p.st = 'idle'; p.t = 0; p._s1 = 0; p._n = -1; }
}

function teamAttack(S, p) {
  S.team = 0;
  sfx(S, 'team');
  ev(S, { t: 'team', heroes: alivePlayers(S).map((q) => q.hero) });
  for (const q of alivePlayers(S)) { q.st = 'pose'; q.t = 0; q.inv = 2; q.atk = null; }
  S.teamT = 1.25;
  S.hitstop = 0.1;
}

/* ---------------- enemies ---------------- */
function spawnEnemy(S, type, x, y, extra = {}) {
  const d = ENEMIES[type];
  const lvlBoost = 1 + S.lvl * 0.09;
  const e = {
    id: nid(), type, def: d, x, y, z: 0, vz: 0, vx: 0, face: x < S.cam + W / 2 ? 1 : -1,
    hp: Math.round(d.hp * lvlBoost), max: Math.round(d.hp * lvlBoost), st: 'enter', t: 0, cool: rand(0.4, 1.4), inv: 0, flash: 0,
    target: 0, walk: Math.random() * 3, side: Math.random() < 0.5 ? -1 : 1, ...extra,
  };
  if (d.shade) {
    const hs = S.players.length ? S.players.map((p) => p.hero) : [0, 1, 2, 3, 4];
    e.shadeHero = pick(hs);
  }
  S.enemies.push(e);
  return e;
}

function nearestPlayer(S, e) {
  let best = null, bd = 1e9;
  for (const p of S.players) {
    if (p.out || p.st === 'dead') continue;
    const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 1.5 + (p.id === e.target ? -120 : 0);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

function stepEnemy(S, e, dt) {
  e.t += dt;
  e.inv = Math.max(0, e.inv - dt);
  e.flash = Math.max(0, (e.flash || 0) - dt);
  if (e.boss) return stepBoss(S, e, dt);
  const d = e.def;
  const scale = 1 + S.lvl * 0.04;
  switch (e.st) {
    case 'enter': {
      // walk into the arena from off-screen
      const tx = clamp(e.x, S.cam + 80, S.cam + W - 80);
      e.x += Math.sign(tx - e.x) * d.speed * 1.2 * dt;
      e.walk += dt * 8;
      if (Math.abs(tx - e.x) < 6 || e.t > 3) { e.st = 'walk'; e.t = 0; }
      break;
    }
    case 'idle': case 'walk': {
      const p = nearestPlayer(S, e);
      if (!p) { e.st = 'idle'; break; }
      e.target = p.id;
      e.cool -= dt * d.aggro * scale;
      // how many are already attacking this player?
      const attackers = S.enemies.filter((o) => o !== e && !o.boss && o.target === p.id && ['wind', 'atk'].includes(o.st)).length;
      const close = S.enemies.filter((o) => o !== e && !o.boss && o.target === p.id && Math.abs(o.x - p.x) < d.reach + 30 && o.hp > 0).length;
      const side = e.x < p.x ? -1 : 1;
      const wantDist = close >= 2 && attackers >= 1 ? 230 : d.reach * 0.78;
      const tx = p.x + side * wantDist;
      const ty = p.y + (close >= 2 ? (e.id % 3 - 1) * 40 : 0);
      const ddx = tx - e.x, ddy = ty - e.y;
      e.face = p.x > e.x ? 1 : -1;
      if (Math.abs(ddx) > 10 || Math.abs(ddy) > 8) {
        const sp = d.speed * scale;
        e.x += clamp(ddx, -1, 1) * Math.min(Math.abs(ddx), sp * dt);
        e.y += clamp(ddy, -1, 1) * Math.min(Math.abs(ddy), sp * 0.6 * dt);
        e.st = 'walk'; e.walk += dt * 7.5;
      } else e.st = 'idle';
      const inRange = Math.abs(p.x - e.x) < d.reach + 8 && Math.abs(p.y - e.y) < 22;
      if (inRange && e.cool <= 0 && attackers < 2 && p.z < 60) {
        e.st = 'wind'; e.t = 0; e.kick = Math.random() < 0.35;
        sfx(S, 'wind');
      }
      break;
    }
    case 'wind': if (e.t > d.wind) { e.st = 'atk'; e.t = 0; e.didHit = false; } break;
    case 'atk': {
      if (d.lunge && e.t < 0.2) e.x += e.face * 330 * dt;
      if (!e.didHit && e.t > 0.05) {
        e.didHit = true;
        for (const p of S.players) {
          if (p.out || p.st === 'dead') continue;
          const rx = (p.x - e.x) * e.face;
          if (rx > -10 && rx < d.reach + (d.lunge ? 50 : 0) && Math.abs(p.y - e.y) < 30 && p.z < 70)
            hurtPlayer(S, p, Math.round(d.dmg * (1 + S.lvl * 0.07)), { knock: d.heavy || e.kick && Math.random() < 0.3, from: e.x });
        }
      }
      if (e.t > 0.34) { e.st = 'walk'; e.t = 0; e.cool = rand(0.9, 1.9); }
      break;
    }
    case 'hurt': if (e.t > 0.38) { e.st = 'walk'; e.t = 0; e.cool = Math.max(e.cool, 0.5); } break;
    case 'held': if (e.t > 3) { e.st = 'walk'; e.t = 0; const h = S.players.find((q) => q.id === e.holder); if (h) { h.st = 'idle'; h.hold = 0; } } break;
    case 'knock': case 'thrown': {
      e.x += e.vx * dt; e.vx *= 0.985;
      e.z += e.vz * dt; e.vz -= 1500 * dt;
      if (e.st === 'thrown') {
        // thrown bodies bowl over other enemies
        for (const o of S.enemies) if (o !== e && hittable(o) && Math.abs(o.x - e.x) < 60 && Math.abs(o.y - e.y) < 34 && !o.boss) {
          const thrower = S.players.find((q) => q.id === e.thrower);
          damageEnemy(S, thrower, o, 16, { knock: true, heavy: true, from: e.x - Math.sign(e.vx) });
        }
        for (const o of S.props) if (o.hp > 0 && Math.abs(o.x - e.x) < 50 && Math.abs(o.y - e.y) < 40) hitProp(S, o, S.players.find((q) => q.id === e.thrower));
      }
      e.x = clamp(e.x, S.cam - 40, S.cam + W + 40);
      if (e.z <= 0 && e.t > 0.1) {
        e.z = 0; e.st = e.hp > 0 ? 'down' : 'dead'; e.t = 0; shake(S, 3); sfx(S, 'heavy'); sparks(S, e.x, e.y, '#9aa0b0', 8, 'dust');
        if (e.hp <= 0 && e.def && e.def.shade) sparks(S, e.x, e.y - 60, '#b77dff', 20, 'fire');
      }
      break;
    }
    case 'down': if (e.t > 0.85) { e.st = 'getup'; e.t = 0; } break;
    case 'getup': if (e.t > 0.3) { e.st = 'walk'; e.t = 0; e.inv = 0.3; e.cool = 0.8; } break;
  }
  if (!['knock', 'thrown', 'held', 'dead', 'enter'].includes(e.st)) {
    e.y = clamp(e.y, FLOOR_TOP, FLOOR_BOTTOM);
    if (S.camLock !== null) e.x = clamp(e.x, S.camLock + 30, S.camLock + W - 30);
  }
}

/* ---------------- bosses ---------------- */
function spawnBoss(S, key, x, y) {
  const B = BOSSES[key];
  const hpMul = 1 + (alivePlayers(S).length - 1) * 0.45;
  const e = {
    id: nid(), boss: true, key, B, sprite: B.sprite || key, x, y, z: 0, vz: 0, face: -1, hp: Math.round(B.hp * hpMul), max: Math.round(B.hp * hpMul),
    st: 'intro', t: 0, cool: 1.2, inv: 0, flash: 0, walk: 0, pat: 0, poise: 0, target: 0, alpha: 1,
  };
  S.enemies.push(e);
  S.bossId = e.id;
  return e;
}

function stepBoss(S, e, dt) {
  const B = e.B;
  const phase2 = e.hp < e.max * 0.5;
  const sp = B.speed * (phase2 ? 1.2 : 1);
  const p = nearestPlayer(S, e);
  if (!p && !['dead', 'gone'].includes(e.st)) { e.st = 'idle'; return; }
  const hurtAll = (test, dmg, knock = true) => {
    for (const q of S.players) if (!q.out && q.st !== 'dead' && test(q)) hurtPlayer(S, q, dmg, { knock, from: e.x });
  };
  switch (e.st) {
    case 'intro': {
      e.x -= 60 * dt; e.walk += dt * 5;
      if (e.t > 1.6) { e.st = 'walk'; e.t = 0; }
      break;
    }
    case 'idle': case 'walk': {
      e.target = p.id;
      e.cool -= dt * (phase2 ? 1.35 : 1);
      e.face = p.x > e.x ? 1 : -1;
      const ranged = ['orbs', 'blast', 'summon', 'split', 'mirror', 'wave', 'teleport', 'burrow'].includes(B.pattern[e.pat % B.pattern.length]);
      const want = ranged ? 360 : B.reach * 0.75;
      const ddx = p.x - e.face * want - e.x, ddy = p.y - e.y;
      if (Math.abs(ddx) > 14) { e.x += Math.sign(ddx) * Math.min(Math.abs(ddx), sp * dt); e.walk += dt * 6; e.st = 'walk'; }
      else e.st = 'idle';
      if (Math.abs(ddy) > 8) e.y += Math.sign(ddy) * Math.min(Math.abs(ddy), sp * 0.55 * dt);
      if (e.cool <= 0 && (Math.abs(ddx) < 60 || ranged || e.t > 2.2)) {
        e.move = B.pattern[e.pat % B.pattern.length]; e.pat++;
        e.st = 'wind'; e.t = 0; e.tx = p.x; e.ty = p.y;
        sfx(S, 'bosswind');
        if (e.move === 'guard') { e.st = 'guard'; e.guarding = true; }
      }
      break;
    }
    case 'guard': {
      e.face = p.x > e.x ? 1 : -1;
      if (e.t > 1.4) { e.guarding = false; e.st = 'wind'; e.t = 0; e.move = 'slash'; }
      break;
    }
    case 'wind': {
      const wt = { punch: 0.75, slam: 0.95, charge: 0.7, lunge: 0.6, claw: 0.55, drill: 0.7, slash: 0.55, sweep: 0.8, blast: 0.9, orbs: 0.6, summon: 0.7, split: 0.7, mirror: 0.8, wave: 0.6, teleport: 0.4, burrow: 0.5 }[e.move] || 0.7;
      if (['slam'].includes(e.move)) { e.tx = lerp(e.tx, p.x, dt * 3); e.ty = lerp(e.ty, p.y, dt * 3); }
      if (e.t > wt * (phase2 ? 0.8 : 1)) { e.st = 'atk'; e.t = 0; e.didHit = false; bossAttack(S, e, p); }
      break;
    }
    case 'atk': {
      const m = e.move;
      if (['charge', 'lunge', 'drill'].includes(m)) {
        const dur = m === 'lunge' ? 0.45 : 0.9;
        e.x += e.face * (m === 'lunge' ? 620 : 700) * dt;
        hurtAll((q) => !e._hitSet.has(q.id) && Math.abs(q.x - e.x) < 110 && Math.abs(q.y - e.y) < 42 && q.z < 90 && (e._hitSet.add(q.id), true), B.dmg);
        if (S.camLock !== null) e.x = clamp(e.x, S.camLock + 60, S.camLock + W - 60);
        if (e.t > dur || (S.camLock !== null && (e.x <= S.camLock + 61 || e.x >= S.camLock + W - 61))) { e.st = 'recover'; e.t = 0; shake(S, 6); }
      } else if (e.t > 0.55) { e.st = 'recover'; e.t = 0; }
      break;
    }
    case 'recover': if (e.t > (phase2 ? 0.35 : 0.6)) { e.st = 'walk'; e.t = 0; e.cool = rand(0.9, 1.6); } break;
    case 'hurt': if (e.t > 0.45) { e.st = 'walk'; e.t = 0; e.cool = Math.min(e.cool, 0.5); } break;
    case 'teleport': {
      e.alpha = Math.max(0, 1 - e.t * 3);
      if (e.t > 0.5) {
        const q = p;
        e.x = clamp(q.x + (q.x - S.cam > W / 2 ? -380 : 380), S.cam + 100, S.cam + W - 100); e.y = q.y;
        e.st = 'appear'; e.t = 0;
        sparks(S, e.x, e.y - 120, '#b77dff', 30, 'fire');
      }
      break;
    }
    case 'appear': e.alpha = Math.min(1, e.t * 3); if (e.t > 0.4) { e.st = 'walk'; e.t = 0; e.cool = 0.4; } break;
    case 'burrow': {
      e.alpha = Math.max(0, 1 - e.t * 2.5);
      if (e.t < 1.2) { e.tx = lerp(e.tx, p.x, dt * 2.5); e.ty = lerp(e.ty, p.y, dt * 2.5); }
      if (e.t > 1.5) {
        e.x = e.tx; e.y = e.ty; e.alpha = 1; e.st = 'atk'; e.t = 0; e.move = 'erupt';
        ev(S, { t: 'boom', x: e.x, y: e.y - 20 }); sfx(S, 'stomp'); shake(S, 14);
        hurtAll((q) => Math.hypot(q.x - e.x, (q.y - e.y) * 1.5) < 150 && q.z < 60, B.dmg + 6);
      }
      break;
    }
    case 'dead': {
      e.alpha = 1;
      if (e.t < 2.2 && Math.random() < dt * 14) { ev(S, { t: 'boom', x: e.x + rand(-80, 80), y: e.y - rand(40, 220) }); if (Math.random() < 0.5) sfx(S, 'boom'); }
      if (e.t > 2.4) e.st = 'gone';
      break;
    }
  }
  e.y = clamp(e.y, FLOOR_TOP + 6, FLOOR_BOTTOM);
}

function bossAttack(S, e, p) {
  const B = e.B, m = e.move;
  const phase2 = e.hp < e.max * 0.5;
  const hurtAll = (test, dmg, knock = true) => {
    for (const q of S.players) if (!q.out && q.st !== 'dead' && test(q)) hurtPlayer(S, q, dmg, { knock, from: e.x });
  };
  e._hitSet = new Set();
  switch (m) {
    case 'punch': case 'claw': case 'slash': case 'sweep':
      sfx(S, 'heavy');
      hurtAll((q) => { const rx = (q.x - e.x) * e.face; return rx > -30 && rx < B.reach + (m === 'sweep' ? 50 : 0) && Math.abs(q.y - e.y) < (m === 'sweep' ? 60 : 44) && q.z < 90; }, B.dmg, m !== 'claw');
      sparks(S, e.x + e.face * B.reach * 0.7, e.y - 110, '#ffd6a0', 10, 'slash');
      break;
    case 'slam':
      ev(S, { t: 'boom', x: e.tx, y: e.ty - 10 }); ring(S, e.tx, e.ty, '#ffaa4c', 150, 0.45); shake(S, 14); sfx(S, 'stomp');
      hurtAll((q) => Math.hypot(q.x - e.tx, (q.y - e.ty) * 1.4) < 130 && q.z < 40, B.dmg + 6);
      break;
    case 'charge': case 'lunge': case 'drill':
      sfx(S, 'heavy'); break;
    case 'blast': {
      sfx(S, 'laser'); ev(S, { t: 'beam', x: e.x + e.face * 90, y: e.y - 105, dir: e.face, len: 900, c: '#c07bff' }); shake(S, 8);
      hurtAll((q) => (q.x - e.x) * e.face > 0 && Math.abs(q.y - e.y) < 46 && q.z < 100, B.dmg);
      break;
    }
    case 'orbs': {
      const n = phase2 ? 5 : 3;
      for (let i = 0; i < n; i++) S.shots.push({ id: nid(), kind: 'orb', x: e.x + e.face * 60, y: e.y + (i - (n - 1) / 2) * 34, z: 100, vx: e.face * (220 + i * 25), vy: 0, owner: e.id, life: 4.5, dmg: 14, homing: 0.9, c: e.key === 'custode' ? '#4fe3d9' : '#c07bff' });
      sfx(S, 'laser');
      break;
    }
    case 'wave': {
      S.shots.push({ id: nid(), kind: 'wave', x: e.x + e.face * 80, y: e.y, z: 0, vx: e.face * 560, owner: e.id, life: 2.5, dmg: 18 });
      if (phase2) S.shots.push({ id: nid(), kind: 'wave', x: e.x + e.face * 80, y: clamp(e.y + (e.y > 600 ? -70 : 70), FLOOR_TOP, FLOOR_BOTTOM), z: 0, vx: e.face * 520, owner: e.id, life: 2.5, dmg: 18 });
      sfx(S, 'laser');
      break;
    }
    case 'summon': case 'split': case 'mirror': {
      const type = m === 'split' ? 'segment' : m === 'mirror' ? 'shade' : pick(['soldier', 'lancer', 'lancer']);
      const count = Math.min(m === 'summon' ? 3 : 2, 6 - S.enemies.filter((o) => !o.boss && o.hp > 0).length);
      for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1;
        const x = m === 'summon' ? S.camLock + (side > 0 ? W + 60 : -60) : e.x + side * 90;
        const n = spawnEnemy(S, type, x, clamp(e.y + (i - 0.5) * 70, FLOOR_TOP, FLOOR_BOTTOM));
        if (m !== 'summon') { n.st = 'walk'; sparks(S, n.x, n.y - 80, m === 'split' ? '#ff6a4a' : '#b77dff', 16, 'fire'); }
      }
      if (m === 'split') { floatText(S, e.x, e.y - 260, 'SI DIVIDE!', '#ffb080', 22); e.hp -= 0; }
      if (m === 'mirror') floatText(S, e.x, e.y - 260, 'COPIE OSCURE', '#d0b0ff', 22);
      break;
    }
    case 'teleport': e.st = 'teleport'; e.t = 0; sfx(S, 'laser'); break;
    case 'burrow': e.st = 'burrow'; e.t = 0; sparks(S, e.x, e.y, '#8a7a5a', 30, 'dust'); sfx(S, 'stomp'); break;
  }
}

function killBoss(S, e, p) {
  if (e.st === 'dead' || e.st === 'gone') return;
  e.st = 'dead'; e.t = 0; e.hp = 0; e.guarding = false;
  S.hitstop = 0.35; shake(S, 20); sfx(S, 'boom'); ev(S, { t: 'flash', c: '#ffffff', v: 0.6 });
  if (p && p.score !== undefined) p.score += 5000;
  for (const o of S.enemies) if (!o.boss && o.hp > 0) { o.hp = 0; o.st = 'knock'; o.t = 0; o.vx = (o.x > e.x ? 1 : -1) * 300; o.vz = 300; o.z = 1; }
  S.shots = [];
}

/* ---------------- projectiles ---------------- */
function stepShots(S, dt) {
  for (const s of S.shots) {
    s.life -= dt;
    if (s.homing && !s.friendly) {
      const p = nearestPlayer(S, s);
      if (p) { s.vy = lerp(s.vy || 0, clamp(p.y - s.y, -120, 120), dt * s.homing); }
    }
    s.x += s.vx * dt; s.y += (s.vy || 0) * dt;
    if (s.friendly) {
      const owner = S.players.find((q) => q.id === s.owner);
      for (const e of S.enemies) if (hittable(e) && !s.hit.has(e.id) && Math.abs(e.x - s.x) < 70 && Math.abs(e.y - s.y) < 60) {
        s.hit.add(e.id); damageEnemy(S, owner, e, s.dmg, { knock: true, heavy: true, from: s.x - s.vx });
      }
      for (const o of S.props) if (o.hp > 0 && !s.hit.has(o.id) && Math.abs(o.x - s.x) < 50 && Math.abs(o.y - s.y) < 50) { s.hit.add(o.id); hitProp(S, o, owner); }
    } else {
      for (const p of S.players) if (!p.out && p.st !== 'dead' && Math.abs(p.x - s.x) < (s.kind === 'wave' ? 48 : 40) && Math.abs(p.y - s.y) < 30 && p.z < (s.kind === 'wave' ? 50 : 140)) {
        if (hurtPlayer(S, p, s.dmg, { knock: s.kind === 'wave', from: s.x - s.vx })) { s.life = 0; sparks(S, s.x, s.y - s.z, s.c || '#c07bff', 12); }
      }
    }
    if (s.x < S.cam - 200 || s.x > S.cam + W + 200) s.life = 0;
  }
  S.shots = S.shots.filter((s) => s.life > 0);
}

/* ---------------- items ---------------- */
function stepItems(S, dt) {
  for (const it of S.items) {
    if (it.z > 0 || it.vz) { it.z += it.vz * dt; it.vz -= 900 * dt; if (it.z <= 0) { it.z = 0; it.vz = Math.abs(it.vz) > 120 ? -it.vz * 0.35 : 0; } }
    if (!ITEMS[it.type].weapon) it.life -= dt;
  }
  S.items = S.items.filter((i) => i.life > 0);
}

/* ---------------- civilians ---------------- */
function stepCivs(S, dt) {
  for (const c of S.civs) {
    c.t += dt;
    if (c.mode === 'flee' || c.mode === 'saved') {
      c.x += c.face * c.speed * dt;
      if (c.mode === 'saved' && !c.said && c.t > 0.2) { c.said = true; floatText(S, c.x, c.y - 160, pick(['GRAZIE!', 'SIETE VOI!', 'EVVIVA!', 'SALVI!']), '#ffffff', 18); }
    }
  }
  S.civs = S.civs.filter((c) => c.x > S.cam - 150 && c.x < S.cam + W + 400 || c.mode === 'cower');
  // ambient: during the first chapter more people flee from the invasion
  S.ambientT -= dt;
  if (S.ambientT <= 0 && S.lvl === 0 && S.zoneIdx < 3 && S.civs.length < 6) {
    S.ambientT = rand(2.5, 5);
    S.civs.push(makeCiv(pick(CIVS), S.cam + W + 60, rand(FLOOR_TOP, 540), 'flee'));
  }
}

/* ---------------- zones & waves ---------------- */
function stepZones(S, dt) {
  const L = S.L;
  const z = L.zones[S.zoneIdx];
  if (!z) return;
  const lead = Math.max(...alivePlayers(S).map((p) => p.x), S.cam + 200);
  if (!S.zoneOn && S.phase === 'stage') {
    if (lead > z.x - 120 && !S.cleared) {
      S.zoneOn = true; S.wave = 0; S.camLock = clamp(z.x - 380, 0, L.length - W);
      S.banner = { text: z.name, t: 2.4 };
      S.checkpoint = S.zoneIdx;
      if (z.boss) {
        const b = spawnBoss(S, z.boss, S.camLock + W + 120, 600);
        S.banner = { text: BOSSES[z.boss].name, sub: BOSSES[z.boss].title, t: 3, boss: true };
        sfx(S, 'siren');
      } else {
        spawnWave(S, z, 0);
        for (const [i, cv] of (z.c || []).entries()) S.civs.push({ ...makeCiv(cv, S.camLock + 260 + i * 520, FLOOR_TOP + 4 + (i % 2) * 10, 'cower'), face: i % 2 ? -1 : 1 });
      }
    }
    return;
  }
  if (!S.zoneOn) return;
  if (z.boss) {
    const b = S.enemies.find((e) => e.boss);
    if (!b || b.st === 'gone') {
      if (!S.endT) { S.endT = 0.001; }
      S.endT += dt;
      if (S.endT > 1.2) S.result = L.giant ? 'giant' : 'clear';
    }
    return;
  }
  const alive = S.enemies.filter((e) => e.hp > 0 || !['dead'].includes(e.st)).filter((e) => e.hp > 0).length;
  if (S.wave < z.w.length - 1 && alive <= 1) { S.wave++; spawnWave(S, z, S.wave); }
  else if (S.wave >= z.w.length - 1 && alive === 0 && !S.enemies.some((e) => e.st === 'knock')) {
    // zone clear
    S.zoneOn = false; S.camLock = null; S.zoneIdx++;
    for (const c of S.civs) if (c.mode === 'cower') { c.mode = 'saved'; c.face = -1; c.t = 0; c.speed = 240; for (const p of alivePlayers(S)) p.score += 300; }
    const zz = L.zones[S.zoneIdx];
    ev(S, { t: 'go' });
    for (const p of S.players) p.hp = Math.min(p.max, p.hp + 10);
  }
}

function spawnWave(S, z, i) {
  const [type, n0] = z.w[i];
  const extra = Math.max(0, alivePlayers(S).length - 1);
  const n = n0 + Math.ceil(extra * n0 * 0.5);
  for (let k = 0; k < n; k++) {
    const side = k % 2 ? 1 : -1;
    const x = side > 0 ? S.camLock + W + 60 + k * 40 : S.camLock - 60 - k * 40;
    spawnEnemy(S, type, x, FLOOR_TOP + 20 + ((k * 53) % (FLOOR_BOTTOM - FLOOR_TOP - 30)));
  }
}

function stepCamera(S, dt) {
  const ps = alivePlayers(S);
  if (S.camLock !== null) { S.cam = lerp(S.cam, S.camLock, Math.min(1, dt * 4)); return; }
  if (!ps.length) return;
  const mid = ps.reduce((a, p) => a + p.x, 0) / ps.length;
  const minX = Math.min(...ps.map((p) => p.x));
  let target = clamp(mid - 440, 0, S.L.length - W);
  target = Math.min(target, minX - 60); // nobody left behind
  if (target > S.cam) S.cam = lerp(S.cam, target, Math.min(1, dt * 5));
}

/* =========================================================
   VIEW — dati minimi per disegnare (anche via rete)
   ========================================================= */
function playerFrame(p) {
  const pre = HEROES[p.hero].id;
  let f = 0, rot = 0;
  switch (p.st) {
    case 'walk': f = [1, 2, 3, 2][Math.floor(p.walk) % 4]; break;
    case 'jump': f = p.atk === 'air' ? 6 : 4; break;
    case 'land': f = 4; break;
    case 'drop': f = 4; break;
    case 'dodge': f = 1; break;
    case 'atk': {
      if (p.atk === 'pickup') { f = 4; break; }
      const m = MOVES[p.atk]; f = m.frames.find(([t]) => p.t < t)?.[1] ?? m.frames[m.frames.length - 1][1];
      break;
    }
    case 'grab': f = 4; break;
    case 'grabatk': f = p.t > 0.08 ? 6 : 4; break;
    case 'throw': f = 5; break;
    case 'special': {
      const k = p.spk;
      f = k === 'azur' ? 5 : k === 'lyra' ? (Math.floor(p.t / 0.08) % 2 ? 5 : 6) : k === 'onyx' ? (p.t < 0.3 ? 4 : 5) : p.t < 0.18 ? 4 : 5;
      break;
    }
    case 'pose': f = p.t < 0.3 ? 0 : 4; break;
    case 'hurt': f = 7; break;
    case 'knock': f = 7; rot = -Math.min(1, p.t * 4) * Math.PI / 2 * 0.95; break;
    case 'down': case 'dead': f = 7; rot = -Math.PI / 2 * 0.95; break;
    case 'getup': f = 4; rot = -(1 - p.t / 0.3) * 0.6; break;
  }
  return [`${pre}_${f}`, rot];
}

function enemyFrame(e) {
  if (e.boss) {
    const B = e.B, s = e.sprite;
    let f = 0;
    const eight = B.frames === 8;
    switch (e.st) {
      case 'walk': case 'intro': f = eight ? [0, 1, 2, 1][Math.floor(e.walk) % 4] : [1, 0, 2, 0][Math.floor(e.walk) % 4]; break;
      case 'idle': case 'appear': case 'teleport': f = 0; break;
      case 'guard': f = eight ? 3 : 5; break;
      case 'wind': f = 3; break;
      case 'atk': f = eight ? (e.move === 'slam' ? 5 : 4) : 4; break;
      case 'recover': f = eight ? (e.move === 'slam' ? 5 : 4) : 4; break;
      case 'burrow': f = 3; break;
      case 'hurt': f = eight ? 6 : 5; break;
      case 'dead': case 'gone': f = eight ? 7 : 5; break;
    }
    return [`${s}_${f}`, 0];
  }
  const d = e.def;
  let pre = d.pre;
  if (d.shade) pre = HEROES[e.shadeHero].id;
  let f = 0, rot = 0;
  if (d.villain) {
    // centipede segments use the 6-frame villain layout
    switch (e.st) {
      case 'walk': case 'enter': f = [1, 0, 2, 0][Math.floor(e.walk) % 4]; break;
      case 'wind': f = 3; break; case 'atk': f = 4; break;
      case 'hurt': case 'held': f = 5; break;
      case 'knock': case 'thrown': f = 5; rot = -Math.min(1, e.t * 4) * 1.4; break;
      case 'down': case 'dead': f = 5; rot = -1.4; break;
      case 'getup': f = 3; break;
    }
    return [`${pre}_${f}`, rot];
  }
  switch (e.st) {
    case 'walk': case 'enter': f = [1, 2, 3, 2][Math.floor(e.walk) % 4]; break;
    case 'wind': f = 4; break;
    case 'atk': f = e.kick ? 6 : 5; break;
    case 'hurt': case 'held': f = 7; break;
    case 'knock': case 'thrown': f = 7; rot = -Math.min(1, e.t * 4) * Math.PI / 2 * 0.95; break;
    case 'down': case 'dead': f = 7; rot = -Math.PI / 2 * 0.95; break;
    case 'getup': f = 4; rot = -(1 - e.t / 0.3) * 0.6; break;
  }
  return [`${pre}_${f}`, rot];
}

function civFrame(c) {
  const t = c.type;
  if (c.mode === 'cower') return `${t}_cower`;
  if (c.mode === 'flee' || c.mode === 'saved') return `${t}_run${Math.floor(c.t * 11) % 6}`;
  return `${t}_idle${Math.floor(c.t * 2) % 2}`;
}

function buildView(S) {
  const d = [];
  const r = (v) => Math.round(v);
  for (const o of S.props) if (o.hp > 0) d.push({ i: o.id, s: 'items', f: o.type, x: r(o.x + (o.shake > 0 ? Math.sin(S.t * 80) * 3 : 0)), y: r(o.y), sc: o.type === 'crate' ? 1.05 : 1.0, sh: 30 });
  for (const it of S.items) d.push({ i: it.id, s: 'items', f: it.type, x: r(it.x), y: r(it.y), z: r(it.z + (it.z === 0 && !ITEMS[it.type].weapon ? 4 + Math.sin(S.t * 4 + it.bob) * 3 : 0)), sc: ITEMS[it.type].weapon ? 1.1 : 1.15, sh: 18, a: it.life < 3 && !ITEMS[it.type].weapon ? (Math.floor(S.t * 10) % 2 ? 0.3 : 1) : 1, glow: ITEMS[it.type].weapon ? 0 : 1 });
  for (const c of S.civs) d.push({ i: c.id, s: 'people', f: civFrame(c), x: r(c.x), y: r(c.y), fc: c.face, sc: 1, sh: 26, dim: c.mode !== 'saved' ? 0.1 : 0 });
  for (const e of S.enemies) {
    if (e.st === 'gone') continue;
    const [f, rot] = enemyFrame(e);
    const boss = e.boss;
    const sc = boss ? e.B.scale : e.def.scale * (e.def.villain ? 1 : 1);
    const o = { i: e.id, s: boss || e.def.villain ? 'bosses' : 'fighters', f, x: r(e.x), y: r(e.y), z: r(e.z || 0), fc: e.face, sc, r: rot, sh: boss ? 90 : 36 };
    if (e.flash > 0) o.fl = 1;
    if (e.def && e.def.shade) o.ti = '#3a1466';
    if (boss && e.alpha !== undefined && e.alpha < 1) o.a = +e.alpha.toFixed(2);
    if (e.st === 'dead') o.a = boss ? 1 : +(Math.max(0, 1 - e.t / 1.1) * (Math.floor(e.t * 16) % 2 ? 0.4 : 1)).toFixed(2);
    if (boss && e.st === 'dead') { o.a = e.t > 1.8 ? +Math.max(0, 1 - (e.t - 1.8) / 0.6).toFixed(2) : 1; o.fl = Math.floor(e.t * 12) % 2; }
    if (!boss && e.hp > 0 && e.hp < e.max && e.st !== 'held') o.hb = +(e.hp / e.max).toFixed(2);
    if (e.st === 'wind' && boss && e.move === 'slam') o.tg = [r(e.tx), r(e.ty), 130];
    if (e.st === 'burrow') o.tg = [r(e.tx), r(e.ty), 140];
    if (e.st === 'wind' && boss && e.move === 'blast') o.bl = 1;
    if (e.st === 'wind' && !boss) o.wn = 1;
    if (e.guarding) o.gd = 1;
    d.push(o);
  }
  for (const p of S.players) {
    if (p.out) continue;
    const [f, rot] = playerFrame(p);
    const o = { i: p.id, s: 'fighters', f, x: r(p.x), y: r(p.y), z: r(p.z), fc: p.face, sc: HERO_SCALE, r: rot, sh: 36, pl: p.slot + 1, pc: HEROES[p.hero].color };
    if (p.civil) { o.s = 'people'; o.sc = 1; o.r = 0; o.f = `${HEROES[p.hero].id}C_` + (p.st === 'walk' ? 'walk' + (Math.floor(p.walk) % 6) : p.morphT > 0 ? 'raise' : 'idle' + (Math.floor(S.t * 2) % 2)); delete o.wp; }
    if (p.inv > 0 && p.st !== 'special' && p.st !== 'pose' && Math.floor(S.t * 20) % 2) o.a = 0.45;
    if (p.st === 'dead') o.a = +(Math.floor(p.t * 12) % 2 ? 0.3 : 1).toFixed(2);
    if (p.weapon) { o.wp = p.weapon.type; o.wa = p.st === 'atk' && p.atk === 'swing' && p.t > 0.1 ? 1 : 0; }
    if (p.st === 'special' || p.st === 'pose') o.au = HEROES[p.hero].glow;
    if (p.st === 'dodge' || p.run && p.st === 'walk' || p.st === 'special' && p.spk === 'azur') o.gh = 1;
    d.push(o);
  }
  for (const s of S.shots) d.push({ i: s.id, sh2: s.kind, x: r(s.x), y: r(s.y), z: r(s.z), fc: Math.sign(s.vx) || 1, c: s.c });

  const boss = S.enemies.find((e) => e.boss && e.st !== 'gone');
  return {
    m: 'stage', lv: S.lvl, bg: S.L.bg, cam: r(S.cam), t: +S.t.toFixed(2), d,
    hud: {
      p: S.players.map((p) => ({ h: p.hero, n: p.name, hp: Math.max(0, Math.round(p.hp)), mx: p.max, en: Math.round(p.en), sc: p.score, lv: p.lives, out: p.out ? 1 : 0, wp: p.weapon ? p.weapon.type : 0, wu: p.weapon ? p.weapon.uses : 0, cb: p.comboHitT > 0 && p.combo2 > 1 ? p.combo2 : 0 })),
      team: Math.round(S.team),
      boss: boss ? { n: boss.B.name, t: boss.B.title, hp: Math.max(0, boss.hp), mx: boss.max, g: boss.guarding ? 1 : 0 } : null,
      ban: S.banner ? { t: S.banner.text, s: S.banner.sub || '', k: +S.banner.t.toFixed(2), e: +((S.banner.tot || (S.banner.tot = S.banner.t)) - S.banner.t).toFixed(2), b: S.banner.boss ? 1 : 0 } : null,
      go: !S.zoneOn && S.zoneIdx < S.L.zones.length && S.zoneIdx > 0 && !S.cleared ? 1 : 0,
      lvl: S.lvl, place: S.L.place,
    },
    ev: S.events.slice(),
  };
}

/* per-player tick for the "combo" counters */
function tickCounters(S, dt) { for (const p of S.players) { p.comboHitT = Math.max(0, (p.comboHitT || 0) - dt); } }

/* team attack resolution (after the pose) */
function stepTeam(S, dt) {
  if (!S.teamT) return;
  S.teamT -= dt;
  if (S.teamT <= 0) {
    S.teamT = 0;
    ev(S, { t: 'flash', c: '#ffffff', v: 0.8 }); shake(S, 24); sfx(S, 'boom');
    const q = alivePlayers(S)[0];
    for (const e of S.enemies) if (e.hp > 0 && e.st !== 'dead') {
      e.inv = 0; const wasGuard = e.guarding; e.guarding = false;
      damageEnemy(S, q, e, e.boss ? 110 : 90, { knock: true, heavy: true, unblockable: true, from: S.cam + W / 2 });
      e.guarding = wasGuard;
    }
    for (const o of S.props) if (o.hp > 0) hitProp(S, o, q);
    S.enemies.forEach((e) => ev(S, { t: 'boom', x: e.x, y: e.y - 80 }));
  }
}
