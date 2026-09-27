'use strict';
/* ============================================================
   MECCANICHE DEI CAPITOLI — ogni capitolo ha qualcosa di suo:
   1 traffico di scooter · 4 specchi che generano copie e riflettori
   che cadono · 5 antenna da difendere · 6 generatori e presse ·
   7-8 gravità ridotta · livello bonus: la capsula del Velo.
   ============================================================ */
const BONUS_AFTER = [1, 3, 5];   // after chapters 2, 4 and 6
function bonusLevel(idx) {
  const bg = ['rail', 'theater', 'graveyard'][BONUS_AFTER.indexOf(idx)] || 'veil';
  return { n: 'BONUS', bonus: true, bg, place: 'LIVELLO BONUS', title: 'LA CAPSULA DEL VELO', length: W + 100, music: 3, zones: [{ x: 380, name: 'DISTRUGGI LA CAPSULA!' }], intro: [], outro: [] };
}

/* extra props, placed per chapter/zone */
const MECH_PROPS = {
  3: [['mirror', 1900, 520, 1], ['mirror', 2150, 660, 1], ['mirror', 2950, 530, 2], ['mirror', 3200, 670, 2]],
  4: [['antenna', 3150, 520, 2]],
  5: [['generator', 780, 520, 0], ['generator', 1850, 520, 1], ['generator', 2900, 520, 2]],
};
const LOW_GRAVITY = [6, 7];

function mechInit(S) {
  S.haz = [];
  S.hazT = 3;
  if (S.L.bonus) {
    S.props.push({ id: nid(), type: 'capsule', x: 640, y: 600, hp: 30 + S.players.length * 18, max: 30 + S.players.length * 18, shake: 0 });
    S.bonusT = 30; S.phase = 'stage';
    S.banner = { text: 'LIVELLO BONUS!', sub: 'DISTRUGGI LA CAPSULA DEL VELO IN 30 SECONDI', t: 3 };
    return;
  }
  for (const [type, x, y, zone] of MECH_PROPS[S.lvl] || []) S.props.push({ id: nid(), type, x, y, hp: PROPS[type].hp, max: PROPS[type].hp, shake: 0, zone, cd: 0, spawnT: 3 + Math.random() * 3 });
  if (S.lvl === 5) S.haz.push({ id: nid(), type: 'press', x: 2250, y: 600, t: 0 });
}

/* props with special behaviour when hit; returns true when handled */
function mechHitProp(S, o, who) {
  if (o.type === 'generator') {
    if (o.cd > 0) { sparks(S, o.x, o.y - 80, '#8a96a6', 6); return true; }
    o.cd = 8; o.shake = 0.3;
    ev(S, { t: 'ring', x: o.x, y: o.y - 60, c: '#c07bff', r: 260, life: 0.6 }); sparks(S, o.x, o.y - 90, '#c07bff', 24, 'fire'); sfx(S, 'special');
    for (const p of S.players) if (!p.out && Math.abs(p.x - o.x) < 260) { p.en = 100; floatText(S, p.x, p.y - 180, 'ENERGIA PIENA!', '#c9a0ff', 16); }
    S.team = Math.min(100, S.team + 10);
    return true;
  }
  if (o.type === 'antenna') return true;   // players cannot damage the antenna
  if (o.type === 'capsule') {
    o.hp--; o.shake = 0.15; sparks(S, o.x, o.y - 90, '#c07bff', 8); sfx(S, 'hit');
    if (who && who.score !== undefined) who.score += 50;
    if (o.hp <= 0) { ev(S, { t: 'boom', x: o.x, y: o.y - 90, big: 1 }); ev(S, { t: 'flash', c: '#ffffff', v: 0.6 }); sfx(S, 'boom'); shake(S, 16); S.bonusWin = true; }
    return true;
  }
  return false;
}

function stepMech(S, dt) {
  const L = S.L;
  for (const o of S.props) if (o.cd > 0) o.cd = Math.max(0, o.cd - dt);
  // ---- bonus stage timer
  if (L.bonus) {
    if (S.banner && S.banner.t > 0 && S.t < 3) return;
    if (!S.bonusDone) {
      S.bonusT -= dt;
      if (S.bonusWin || S.bonusT <= 0) {
        S.bonusDone = true; S.bonusEnd = S.t;
        const bonus = S.bonusWin ? 10000 + Math.round(S.bonusT) * 500 : 0;
        for (const p of S.players) p.score += Math.round(bonus / S.players.length);
        ev(S, { t: 'pop', x: 640, y: 250, s: S.bonusWin ? `CAPSULA DISTRUTTA! +${bonus}` : 'TEMPO SCADUTO!', c: S.bonusWin ? '#ffd35a' : '#ff8a7a', big: 1, fixed: 1 });
      }
    } else if (S.t - S.bonusEnd > 2.2) S.result = 'bonus';
    return;
  }
  const zone = S.zoneIdx, on = S.zoneOn;
  // ---- chapter 1: scooters crossing the street during the fights
  if (S.lvl === 0 && on && zone < 3) {
    S.hazT -= dt;
    if (S.hazT <= 0) { S.hazT = rand(5, 8); S.haz.push({ id: nid(), type: 'scooter', x: S.cam + W + 120, y: rand(FLOOR_TOP + 20, FLOOR_BOTTOM - 10), t: -1.1, hit: new Set() }); sfx(S, 'siren'); }
  }
  // ---- chapter 4: stage spotlights fall on the players
  if (S.lvl === 3 && on && zone < 3 && zone > 0) {
    S.hazT -= dt;
    if (S.hazT <= 0) { S.hazT = rand(5, 7); const p = pick(alivePlayers(S)); if (p) S.haz.push({ id: nid(), type: 'spot', x: p.x, y: p.y, t: 0 }); }
  }
  // ---- chapter 4: dark mirrors keep spawning shadow copies until broken
  for (const o of S.props) {
    if (o.type !== 'mirror' || o.hp <= 0 || o.zone !== zone || !on) continue;
    o.spawnT -= dt;
    if (o.spawnT <= 0 && S.enemies.filter((e) => e.hp > 0).length < 6) {
      o.spawnT = rand(6, 9);
      const e = spawnEnemy(S, 'shade', o.x + 40, clamp(o.y + 20, FLOOR_TOP, FLOOR_BOTTOM)); e.st = 'walk';
      sparks(S, o.x, o.y - 100, '#b77dff', 20, 'fire'); sfx(S, 'laser');
      floatText(S, o.x, o.y - 220, 'ROMPI GLI SPECCHI!', '#d0b0ff', 16);
    }
  }
  // ---- chapter 5: the Veil soldiers attack the antenna
  for (const o of S.props) {
    if (o.type !== 'antenna' || !on || o.zone !== zone) continue;
    for (const e of S.enemies) {
      if (e.boss || e.hp <= 0 || !['walk', 'idle'].includes(e.st)) continue;
      if (Math.abs(e.x - o.x) < 110 && Math.abs(e.y - o.y) < 50) { o.hp -= dt * 6; o.shake = 0.1; if (Math.random() < dt * 3) sparks(S, o.x, o.y - 150, '#ffd35a', 5); }
    }
    if (o.hp <= 0) {
      o.hp = o.max * 0.5;
      ev(S, { t: 'boom', x: o.x, y: o.y - 150 }); sfx(S, 'boom');
      ev(S, { t: 'pop', x: 640, y: 230, s: 'ANTENNA COLPITA!', c: '#ff8a7a', big: 1, fixed: 1 });
      for (const p of alivePlayers(S)) hurtPlayer(S, p, 18, { from: p.x - p.face });
    }
  }
  // ---- hazards
  for (const h of S.haz) {
    h.t += dt;
    if (h.type === 'scooter' && h.t > 0) {
      h.x -= 560 * dt;
      for (const p of S.players) if (!p.out && p.st !== 'dead' && !h.hit.has(p.id) && Math.abs(p.x - h.x) < 50 && Math.abs(p.y - h.y) < 24 && p.z < 40) { h.hit.add(p.id); hurtPlayer(S, p, 12, { knock: true, from: h.x + 50 }); }
      for (const e of S.enemies) if (hittable(e) && !e.boss && !h.hit.has(e.id) && Math.abs(e.x - h.x) < 50 && Math.abs(e.y - h.y) < 24) { h.hit.add(e.id); damageEnemy(S, null, e, 30, { knock: true, heavy: true, from: h.x + 50 }); }
      if (h.x < S.cam - 200) h.dead = true;
    }
    if (h.type === 'spot' && h.t > 1.2 && !h.hitDone) {
      h.hitDone = true; ev(S, { t: 'boom', x: Math.round(h.x), y: Math.round(h.y) }); sfx(S, 'heavy'); shake(S, 10);
      for (const p of S.players) if (!p.out && Math.hypot(p.x - h.x, (p.y - h.y) * 1.5) < 90 && p.z < 60) hurtPlayer(S, p, 20, { knock: true, from: h.x });
      for (const e of S.enemies) if (hittable(e) && !e.boss && Math.hypot(e.x - h.x, (e.y - h.y) * 1.5) < 90) damageEnemy(S, null, e, 40, { knock: true, heavy: true, from: h.x });
    }
    if (h.type === 'spot' && h.t > 2.4) h.dead = true;
    if (h.type === 'press') {
      const c = h.t % 3.4;
      if (c >= 2.8 && !h.slam) {
        h.slam = true; sfx(S, 'stomp'); shake(S, 8); ev(S, { t: 'ring', x: h.x, y: h.y, c: '#ffd35a', r: 160, life: 0.4 });
        for (const p of S.players) if (!p.out && Math.abs(p.x - h.x) < 95 && Math.abs(p.y - h.y) < 45 && p.z < 80) hurtPlayer(S, p, 22, { knock: true, from: h.x });
        for (const e of S.enemies) if (hittable(e) && !e.boss && Math.abs(e.x - h.x) < 95 && Math.abs(e.y - h.y) < 45) damageEnemy(S, null, e, 60, { knock: true, heavy: true, from: h.x });
      }
      if (c < 2.8) h.slam = false;
    }
  }
  S.haz = S.haz.filter((h) => !h.dead);
}

/* zone can't be cleared while its dark mirrors stand */
function mechZoneBlocked(S) { return S.props.some((o) => o.type === 'mirror' && o.hp > 0 && o.zone === S.zoneIdx) || tunnelBlocked(S); }

function mechView(S, d, r) {
  for (const h of S.haz) {
    if (h.type === 'scooter') {
      if (h.t < 0) d.push({ i: h.id, tg: [r(S.cam + W - 60), r(h.y), 60], x: r(h.x), y: r(h.y) });
      else d.push({ i: h.id, s: 'extra', f: 'scooter', x: r(h.x), y: r(h.y), fc: -1, sc: 1.1, sh: 40 });
    } else if (h.type === 'spot') {
      if (h.t < 1.2) d.push({ i: h.id, tg: [r(h.x), r(h.y), 85], x: r(h.x), y: r(h.y), s: 'extra', f: 'spotlight', z: r(Math.max(0, 700 - (h.t / 1.2) * 700 * (h.t > 0.9 ? 1 : 0.2))), sc: 0.6, sh: 0, a: h.t > 0.9 ? 1 : 0.0001 });
      else d.push({ i: h.id, s: 'extra', f: 'spotlight', x: r(h.x), y: r(h.y), sc: 0.6, sh: 50, r: 0.2, a: +clamp(2.4 - h.t, 0, 1).toFixed(2) });
    } else if (h.type === 'press') {
      const c = h.t % 3.4;
      const warn = c > 2.2 && c < 2.8;
      d.push({ i: h.id, s: 'extra', f: 'press', x: r(h.x + (warn ? Math.sin(S.t * 60) * 3 : 0)), y: r(h.y + 40), sc: 0.9, sh: 0, sy: h.y - 60, tg: warn ? [r(h.x), r(h.y), 95] : undefined, fl: c > 2.8 && c < 3.0 ? 1 : 0 });
    }
  }
}
