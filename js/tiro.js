'use strict';
/* ============================================================
   1.16 — LIVELLO BONUS: IL TIRO A SEGNO
   (al posto della capsula oscura) dopo i capitoli 2, 4 e 6.
   30 secondi: ogni giocatore muove il suo mirino e spara ai soldati
   di Vespera che spuntano dai ripari. I civili non si toccano.
   Usa il sistema degli intervalli (vista { m: 'inter' }, online compreso).
   ============================================================ */
INTERLUDES.tiro = { key: 'tiro', bonus: true, title: 'LIVELLO BONUS', place: 'IL TIRO A SEGNO · 30 SECONDI', bg: 'rail', cast: [], lines: [], after: [], game: 'tiro' };
MINIGAMES.tiro = { name: 'IL TIRO A SEGNO', desc: 'COLPISCI I SOLDATI DI VESPERA · NON SPARARE AI CIVILI', how: 'FRECCE: MIRA · ATTACCO / PISTOLA: SPARA' };

/* the covers: back row, middle row, front row (x, foot y, scale, sprite) */
const TIRO_COVERS = [
  [250, 430, 1.5, 'crate'], [520, 430, 1.5, 'barrel'], [780, 430, 1.5, 'crate'], [1040, 430, 1.5, 'bin'],
  [150, 560, 1.9, 'barrel'], [430, 560, 1.9, 'crate'], [860, 560, 1.9, 'crate'], [1130, 560, 1.9, 'barrel'],
  [300, 700, 2.4, 'crate'], [640, 700, 2.4, 'bin'], [980, 700, 2.4, 'crate'],
];
const TIRO_KINDS = [['soldier', 0.55, 100], ['lancer', 0.2, 150], ['civ', 0.17, -300], ['brute', 0.08, 250]];
const TIRO_CIVS = ['waiter', 'fisher', 'lady', 'elder', 'tourist', 'girl', 'suit', 'kid'];
const TIRO_SIZE = 150;   // height of a target at scale 1 (sprite units)

Object.assign(MG_INIT, {
  tiro: (pl) => ({
    t: 0, time: 30, spawn: 0.6, targets: [], fly: null, flyT: 6, pops: [], bg: 'rail', seq: 0,
    aims: pl.map((p, i) => ({ h: p.hero, x: 340 + i * 200, y: 420, cd: 0, pts: 0, hits: 0, bad: 0 })),
  }),
});
Object.assign(MG_TICK, {
  tiro(G, dt, ed, snd) {
    G.t += dt; G.time -= dt;
    const hard = clamp(G.t / 30, 0, 1);
    // new targets pop up from the free covers
    G.spawn -= dt;
    if (G.spawn <= 0 && G.time > 1) {
      G.spawn = 0.75 - hard * 0.35;
      const free = TIRO_COVERS.map((c, i) => i).filter((i) => !G.targets.some((q) => q.c === i));
      if (free.length) {
        const c = free[Math.floor(Math.random() * free.length)];
        let r = Math.random(), k = TIRO_KINDS[0];
        for (const kk of TIRO_KINDS) { if (r < kk[1]) { k = kk; break; } r -= kk[1]; }
        G.targets.push({ id: ++G.seq, c, k: k[0], v: k[2], civ: TIRO_CIVS[Math.floor(Math.random() * TIRO_CIVS.length)], up: 0, stay: (k[0] === 'lancer' ? 0.9 : 1.5) - hard * 0.45, st: 'up', face: TIRO_COVERS[c][0] < 640 ? 1 : -1 });
      }
    }
    // a drone crosses the sky now and then: worth a lot
    G.flyT -= dt;
    if (!G.fly && G.flyT <= 0 && G.time > 3) { G.fly = { x: -80, y: 150 + Math.random() * 90, v: 330 + hard * 160 }; G.flyT = 6 + Math.random() * 3; snd('laser'); }
    if (G.fly) { G.fly.x += G.fly.v * dt; if (G.fly.x > W + 100) G.fly = null; }
    for (const q of G.targets) {
      if (q.st === 'up') { q.up = Math.min(1, q.up + dt * 5); if (q.up >= 1) { q.stay -= dt; if (q.stay <= 0) q.st = 'down'; } }
      else if (q.st === 'down' || q.st === 'hit') { q.up -= dt * (q.st === 'hit' ? 3 : 5); }
    }
    G.targets = G.targets.filter((q) => q.up > 0 || q.st === 'up');
    // the sights
    for (const A of G.aims) {
      const e = ed.find((q) => q.hero === A.h); if (!e) continue;
      A.cd -= dt;
      const c = e.c;
      A.x = clamp(A.x + ((c.r ? 1 : 0) - (c.l ? 1 : 0)) * 560 * dt, 40, W - 40);
      A.y = clamp(A.y + ((c.d ? 1 : 0) - (c.u ? 1 : 0)) * 460 * dt, 90, H - 60);
      if ((c.pressed.punch || c.pressed.shoot || c.pressed.jump) && A.cd <= 0) {
        A.cd = 0.2; snd('shot');
        let hit = null;
        if (G.fly && Math.abs(G.fly.x - A.x) < 55 && Math.abs(G.fly.y - A.y) < 40) { hit = 'fly'; A.pts += 400; A.hits++; G.pops.push({ x: G.fly.x, y: G.fly.y, s: '+400', c: '#ffd35a', t: 0 }); G.fly = null; snd('boom'); }
        else {
          // front targets first: the covers overlap
          const cand = G.targets.filter((q) => q.st === 'up' && q.up > 0.5).sort((a, b) => TIRO_COVERS[b.c][1] - TIRO_COVERS[a.c][1]);
          for (const q of cand) {
            const [x, y, s] = TIRO_COVERS[q.c];
            const top = y - 64 * s - (TIRO_SIZE * s * 0.55) * q.up;
            if (Math.abs(A.x - x) < 34 * s && A.y > top && A.y < y - 64 * s + 6) {
              hit = q; q.st = 'hit';
              A.pts += q.v; if (q.v > 0) A.hits++; else A.bad++;
              G.pops.push({ x, y: top - 10, s: q.v > 0 ? `+${q.v}` : 'CIVILE! -300', c: q.v > 0 ? '#ffffff' : '#ff6a5a', t: 0 });
              snd(q.v > 0 ? 'hit' : 'hurt');
              break;
            }
          }
        }
        if (!hit) G.pops.push({ x: A.x, y: A.y, s: '', c: '#ffffff', t: 0.25 });
      }
    }
    for (const p of G.pops) p.t += dt;
    G.pops = G.pops.filter((p) => p.t < 0.8);
    if (G.time <= 0) { G.time = 0; G.over = true; }
  },
});
Object.assign(MG_REWARD, {
  tiro(G) {
    const pts = G.aims.reduce((a, A) => a + Math.max(0, A.pts), 0), bad = G.aims.reduce((a, A) => a + A.bad, 0);
    const coins = Math.min(30, Math.floor(pts / 150));
    return {
      title: pts >= 3000 * G.aims.length && !bad ? 'MIRA PERFETTA!' : pts >= 1500 * G.aims.length ? 'OTTIMA MIRA!' : 'SERVE PIÙ ALLENAMENTO',
      lines: [G.aims.map((A) => `${HEROES[A.h].name} ${Math.max(0, A.pts)}`).join(' · ') + (bad ? ` · CIVILI COLPITI ${bad}` : ''), `+${coins} MONETE PER IL NEGOZIO DI BORIS · PUNTI ×10`],
      coins, score: G.aims.map((A) => Math.max(0, A.pts) * 10),
    };
  },
});
Object.assign(MG_DRAW, {
  tiro(G, T, D) {
    coverImage(G.bg || D.bg, 1.08, 0.5, 0.5); g.fillStyle = 'rgba(4,6,14,.28)'; g.fillRect(0, 0, W, H);
    ptitle('TIRO A SEGNO', W / 2, 56, 26, '#fff6d6', '#ff8a5a');
    ptxt(`TEMPO ${Math.ceil(G.time)}`, W - 40, 50, 16, G.time < 8 ? '#ff6a5a' : '#ffffff', 'right');
    G.aims.forEach((A, i) => ptxt(`${i + 1}P ${Math.max(0, A.pts)}`, 40, 44 + i * 26, 12, HEROES[A.h].color));
    // the drone in the sky
    if (G.fly) {
      const key = frameOf('extra', 'drone_1') ? 'drone_1' : null;
      if (key) spr('extra', key, G.fly.x, G.fly.y + 60, { scale: 0.8, face: 1 });
      else { g.fillStyle = '#c07bff'; g.beginPath(); g.arc(G.fly.x, G.fly.y, 24, 0, 7); g.fill(); }
    }
    // row by row: targets behind their cover, then the cover
    const order = TIRO_COVERS.map((c, i) => i).sort((a, b) => TIRO_COVERS[a][1] - TIRO_COVERS[b][1]);
    for (const i of order) {
      const [x, y, s, key] = TIRO_COVERS[i];
      const q = G.targets.find((o) => o.c === i);
      if (q) {
        const coverTop = y - 64 * s;
        const foot = coverTop + TIRO_SIZE * s * 0.45 + (1 - q.up) * TIRO_SIZE * s * 0.6;
        g.save(); g.beginPath(); g.rect(x - 200, 0, 400, coverTop + 4); g.clip();
        const hit = q.st === 'hit';
        if (q.k === 'civ') spr('people', `${q.civ}_idle0`, x, foot, { scale: s * 0.8, face: q.face, flash: hit ? 0.6 : 0 });
        else spr('fighters', `${q.k}_${hit ? 5 : 0}`, x, foot, { scale: s * 0.72, face: q.face, flash: hit ? 0.7 : 0, rot: hit ? -0.3 * q.face : 0 });
        g.restore();
      }
      drawShadow(x, y, 32 * s);
      spr('items', key, x, y, { scale: s });
    }
    for (const p of G.pops) {
      if (p.s) { g.globalAlpha = 1 - p.t / 0.8; ptitle(p.s, p.x, p.y - p.t * 60, 18, p.c, p.c === '#ff6a5a' ? '#7a1010' : '#ffb03a'); g.globalAlpha = 1; }
      else { g.globalAlpha = 1 - p.t / 0.8; g.fillStyle = '#e8e8e8'; g.beginPath(); g.arc(p.x, p.y, 6, 0, 7); g.fill(); g.globalAlpha = 1; }
    }
    // the sights
    G.aims.forEach((A, i) => {
      const c = HEROES[A.h].color;
      g.strokeStyle = '#05070c'; g.lineWidth = 6; g.beginPath(); g.arc(A.x, A.y, 24, 0, 7); g.stroke();
      g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.arc(A.x, A.y, 24, 0, 7); g.stroke();
      g.fillStyle = c; g.fillRect(A.x - 36, A.y - 2, 22, 4); g.fillRect(A.x + 14, A.y - 2, 22, 4); g.fillRect(A.x - 2, A.y - 36, 4, 22); g.fillRect(A.x - 2, A.y + 14, 4, 22);
      ptxt(`${i + 1}P`, A.x + 28, A.y - 26, 9, c);
    });
  },
});

Object.assign(Game, {
  /* the bonus stage after chapters 2, 4 and 6: straight to the game, no talk */
  bonusGame(idx, then) {
    this.mode = 'inter';
    this.afterInter = then;
    this._interPrev = {};
    const pl = this.players.filter((p) => p.device !== 'gone');
    const G = MG_INIT.tiro(pl); G.bg = LEVELS[idx] ? LEVELS[idx].bg : 'rail';
    this.I = { id: 'tiro', ph: 'card', t: 0, i: 0, sel: 0, game: G, res: null, heroes: this.players.map((p) => p.hero) };
    Audio.playSong(3);
    UI.hide();
  },
});
