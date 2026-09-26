'use strict';
/* ============================================================
   CINEMATICHE — intro animata in tempo reale, dialoghi dei
   capitoli, finale. Tutto è funzione del tempo t: così l'host
   può sincronizzare i client online inviando solo t.
   ============================================================ */
const INTRO_LEN = 56;
const INTRO_SUBS = [
  [0.5, 8.5, 'PORTO AURORA · ORE 23:47', 'Una notte qualunque sul lungomare. L\'ultima, prima della guerra.'],
  [9, 13.5, '', 'Poi la terra tremò. E il cielo si spaccò in due.'],
  [13.8, 22, '', 'Gli uomini senza volto uscirono dagli specchi delle vetrine.'],
  [22.5, 31, 'OLTRE IL VELO', '«Riportatemi i Cuori.» — Vespera, la Regina del Velo.'],
  [31.5, 38, 'SOTTO LA CITTÀ', 'Cinque macchine addormentate da millenni risposero al suo nome.'],
  [38.5, 45, '', 'Ma i Cuori scelsero qualcun altro. Cinque persone qualunque.'],
  [45.2, 52, '', ''],
];
const INTRO_CUES = [[0.1, 'crowd'], [9, 'stomp'], [9.4, 'siren'], [10.8, 'boom'], [11.5, 'siren'], [14, 'laser'], [15, 'laser'], [16.2, 'laser'], [17, 'crowd'], [18.5, 'crowd'], [23, 'laser'], [26.5, 'special'], [32, 'morph'], [44.5, 'confirm'], [45.3, 'morph'], [47.2, 'boom'], [49, 'team']];

/* scripted walkers for scene 1 */
const STROLL = [
  ['waiter', 180, 610, 0.35, 1], ['lady', -80, 560, 0.55, 1], ['elder', 1000, 520, -0.32, -1], ['fisher', 780, 660, -0.2, -1],
  ['kid', 60, 640, 0.9, 1], ['tourist', 1300, 590, -0.55, -1], ['girl', 420, 530, 0.45, 1], ['suit', 1180, 690, -0.62, -1],
];

function introSounds(t0, t1) {
  for (const [ct, n] of INTRO_CUES) if (ct > t0 && ct <= t1) Audio.sfx(n);
}

function coverImage(name, zoom = 1, ox = 0.5, oy = 0.5, alpha = 1) {
  const img = IMG[name]; if (!img) return;
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * s, h = img.height * s;
  g.globalAlpha = alpha;
  g.drawImage(img, (W - w) * ox, (H - h) * oy, w, h);
  g.globalAlpha = 1;
}

function rift(cx, cy, open, t) {
  // animated tear in the sky
  g.save();
  g.globalCompositeOperation = 'lighter';
  const r = 30 + open * 210;
  const grd = g.createRadialGradient(cx, cy, 4, cx, cy, r * 1.6);
  grd.addColorStop(0, `rgba(230,190,255,${0.9 * open})`); grd.addColorStop(0.35, `rgba(150,60,230,${0.6 * open})`); grd.addColorStop(1, 'rgba(40,0,80,0)');
  g.fillStyle = grd; g.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  g.strokeStyle = `rgba(255,240,255,${open})`; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + t * 0.2;
    g.beginPath(); g.moveTo(cx, cy);
    let x = cx, y = cy;
    for (let j = 0; j < 5; j++) { x += Math.cos(a + Math.sin(t * 3 + i + j) * 0.5) * r * 0.25; y += Math.sin(a + Math.cos(t * 2 + j) * 0.5) * r * 0.18; g.lineTo(x, y); }
    g.stroke();
  }
  g.restore();
}

function subtitle(t) {
  for (const [a, b, head, body] of INTRO_SUBS) {
    if (t < a || t > b || (!head && !body)) continue;
    const k = clamp(Math.min(t - a, b - t) * 2.5, 0, 1);
    g.globalAlpha = k;
    g.fillStyle = 'rgba(2,6,12,.72)'; g.fillRect(0, H - 118, W, 90);
    if (head) txt(head, W / 2, H - 86, 16, '#ffcf7a', 'center', 900);
    const n = Math.floor((t - a) * 42);
    txt(body.slice(0, n), W / 2, H - 52, 24, '#f2f6fa', 'center', 700);
    g.globalAlpha = 1;
  }
}

function letterbox() {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, 38); g.fillRect(0, H - 28, W, 28);
}

function walker(type, x, y, t, face, mode = 'walk', scale = 1) {
  const frame = mode === 'run' ? `${type}_run${Math.floor(t * 11) % 6}` : mode === 'walk' ? `${type}_walk${Math.floor(t * 7) % 6}` : mode === 'point' ? `${type}_point` : mode === 'cower' ? `${type}_cower` : `${type}_idle${Math.floor(t * 2) % 2}`;
  drawShadow(x, y, 24 * scale);
  spr('people', frame, x, y, { scale, face });
}

function drawIntro(t) {
  g.save();
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  let shakeV = 0;
  if (t < 22) {
    // ---------------- scenes 1–3: the promenade ----------------
    const pan = t * 22;
    if (t > 9 && t < 14) shakeV = 6 * Math.sin((t - 9) * 3);
    g.translate(rand(-1, 1) * shakeV, rand(-1, 1) * shakeV);
    drawStageBackdrop('port', 260 + pan);
    const open = clamp((t - 10.4) / 2.5, 0, 1);
    if (open > 0) rift(980, 110, open, t);
    if (t > 10.8 && t < 11.3) { g.fillStyle = `rgba(220,180,255,${(11.3 - t) * 1.6})`; g.fillRect(0, 0, W, H); }
    // people
    const people = [];
    for (const [type, x0, y, v, face] of STROLL) {
      let x, mode, f = face;
      if (t < 9) { x = x0 + v * 60 * t - pan * 0.15; mode = 'walk'; }
      else if (t < 13.8) { x = x0 + v * 60 * 9 - pan * 0.15; mode = t > 10.6 ? 'point' : 'idle'; f = 1; }
      else { const k = t - 13.8; x = x0 + v * 60 * 9 - pan * 0.15 - k * 230 * (1 + (y % 3) * 0.12); mode = 'run'; f = -1; }
      people.push({ y, draw: () => walker(type, x, y, t + y, f, mode) });
    }
    // soldiers step out of the shop windows (scene 3)
    if (t > 13.8) {
      const k = t - 13.8;
      [[860, 540, 0], [1010, 600, 0.8], [1160, 520, 1.5], [940, 660, 2.3], [1210, 640, 3]].forEach(([x, y, d]) => {
        if (k < d) return;
        const kk = k - d;
        const alpha = clamp(kk * 2, 0, 1);
        const xx = x - kk * 60;
        people.push({ y, draw: () => {
          if (kk < 0.6) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - kk / 0.6; g.fillStyle = '#b77dff'; g.fillRect(xx - 45, y - 160, 90, 165); g.restore(); }
          drawShadow(xx, y, 34);
          spr('fighters', 'soldier_' + [1, 2, 3, 2][Math.floor(kk * 7) % 4], xx, y, { scale: HERO_SCALE, face: -1, alpha });
        } });
      });
    }
    people.sort((a, b) => a.y - b.y).forEach((p) => p.draw());
    // fade in/out
    if (t < 1) { g.fillStyle = `rgba(0,0,0,${1 - t})`; g.fillRect(-20, -20, W + 40, H + 40); }
    if (t > 21.2) { g.fillStyle = `rgba(0,0,0,${(t - 21.2) / 0.8})`; g.fillRect(-20, -20, W + 40, H + 40); }
  } else if (t < 31) {
    // ---------------- scene 4: Vespera beyond the veil ----------------
    const k = t - 22;
    coverImage('veil', 1.05 + k * 0.004, 0.5, 0.6);
    g.fillStyle = 'rgba(20,0,40,.45)'; g.fillRect(0, 0, W, H);
    // mirror frame
    g.save();
    g.strokeStyle = '#c9a24a'; g.lineWidth = 10; g.globalAlpha = 0.9;
    g.beginPath(); g.ellipse(700, 390, 330, 300, 0, 0, 7); g.stroke();
    g.strokeStyle = '#6a4a1a'; g.lineWidth = 3; g.beginPath(); g.ellipse(700, 390, 318, 288, 0, 0, 7); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 + Math.sin(k * 2) * 0.08; g.fillStyle = '#7a3ad0';
    g.beginPath(); g.ellipse(700, 390, 316, 286, 0, 0, 7); g.fill();
    g.restore();
    // Kharon kneels in the dark
    spr('bosses', 'kharon_0', 300, 640, { scale: 1.9, face: 1, alpha: clamp((k - 1) / 1.5, 0, 0.85) });
    // Vespera: full figure, animated, never clipped
    const vf = k < 3.8 ? 0 : k < 4.6 ? 3 : k < 6.6 ? 4 : k < 7.2 ? 3 : 0;
    const va = clamp(k / 1.2, 0, 1);
    spr('bosses', 'vespera_' + vf, 720, 660, { scale: 2.55, face: -1, alpha: va });
    for (let i = 0; i < 26; i++) {
      const a = i * 2.4 + k * 0.7, rr = 220 + Math.sin(i + k) * 60;
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 * va; g.fillStyle = i % 2 ? '#c07bff' : '#7a3ad0';
      g.fillRect(700 + Math.cos(a) * rr, 390 + Math.sin(a) * rr * 0.9, 5, 5); g.restore();
    }
    if (k > 4.6 && k < 6.6) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; g.fillStyle = '#e0c0ff'; g.fillRect(0, 0, W, H); g.restore(); }
    if (k < 0.8) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.8})`; g.fillRect(0, 0, W, H); }
    if (k > 8.2) { g.fillStyle = `rgba(0,0,0,${(k - 8.2) / 0.8})`; g.fillRect(0, 0, W, H); }
  } else if (t < 38) {
    // ---------------- scene 5: the chamber of the cores ----------------
    const k = t - 31;
    coverImage('story_cores', 1.02 + k * 0.025, 0.5, 0.45);
    g.fillStyle = 'rgba(0,10,20,.25)'; g.fillRect(0, 0, W, H);
    const cx = [300, 470, 640, 810, 980];
    HEROES.forEach((h, i) => {
      const on = clamp((k - 0.8 - i * 0.55) * 2, 0, 1);
      g.save(); g.globalCompositeOperation = 'lighter';
      const grd = g.createRadialGradient(cx[i], 420, 4, cx[i], 420, 160);
      grd.addColorStop(0, h.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = on * (0.55 + Math.sin(t * 8 + i) * 0.2); g.fillStyle = grd; g.fillRect(cx[i] - 170, 250, 340, 340);
      g.restore();
    });
    if (k > 4.5) {
      // silhouettes of the titans in the dark
      const a = clamp((k - 4.5) / 1.2, 0, 0.9);
      spr('titans', 'rex_side', 250, 700, { scale: 1.2, img: tinted('titans', 'rex_side', '#05070c', 'source-atop', 0.85), alpha: a });
      spr('titans', 'mammoth_side', 1050, 710, { scale: 1.1, face: -1, img: tinted('titans', 'mammoth_side', '#05070c', 'source-atop', 0.85), alpha: a });
    }
    if (k < 0.7) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.7})`; g.fillRect(0, 0, W, H); }
    if (k > 6.3) { g.fillStyle = `rgba(0,0,0,${(k - 6.3) / 0.7})`; g.fillRect(0, 0, W, H); }
  } else {
    // ---------------- scene 6: five ordinary people → transformation ----------------
    const k = t - 38;
    if (k > 9.2 && k < 10) shakeV = 8;
    g.translate(rand(-1, 1) * shakeV, rand(-1, 1) * shakeV);
    drawStageBackdrop('port', 1700);
    g.fillStyle = 'rgba(10,0,30,.25)'; g.fillRect(0, 0, W, H);
    rift(1100, 90, 1, t);
    // soldiers waiting on the right
    [[1040, 560], [1150, 620], [1090, 680], [1200, 540]].forEach(([x, y], i) => {
      const recoil = k > 9.2 ? Math.min(1, (k - 9.2) * 3) * 40 : 0;
      drawShadow(x + recoil, y, 34);
      spr('fighters', k > 9.2 ? 'soldier_7' : 'soldier_0', x + recoil, y, { scale: HERO_SCALE, face: -1 });
    });
    const xs = [250, 390, 530, 670, 810], ys = [600, 640, 580, 650, 610];
    const order = [0, 1, 2, 3, 4];
    const drawn = order.map((i) => ({ i, y: ys[i] })).sort((a, b) => a.y - b.y);
    for (const { i } of drawn) {
      const h = HEROES[i];
      const arrive = 0.5 + i * 0.45;
      const x = k < arrive + 1.4 ? lerp(-120, xs[i], clamp((k - arrive) / 1.4, 0, 1)) : xs[i];
      const y = ys[i];
      const morph = 7.2 + i * 0.35; // flash time of each hero
      if (k < morph) {
        let f;
        if (k < arrive + 1.4) f = `${h.id}C_dash${Math.floor(k * 11) % 6}`;
        else if (k < 5.8) f = `${h.id}C_stance`;
        else f = `${h.id}C_raise`;
        drawShadow(x, y, 26);
        spr('people', f, x, y, { scale: 1.05 });
        if (k > 4.2) { // core glowing on the chest
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 + Math.sin(t * 12) * 0.3; g.fillStyle = h.glow;
          g.beginPath(); g.arc(x + 4, y - 100, 10 + (k - 4.2) * 3, 0, 7); g.fill(); g.restore();
        }
      } else {
        const kk = k - morph;
        drawShadow(x, y, 36);
        spr('fighters', kk < 1.2 ? `${h.id}_4` : `${h.id}_0`, x, y, { scale: HERO_SCALE * 1.05, flash: Math.max(0, 1 - kk * 1.5) });
      }
      if (k > morph - 0.5 && k < morph + 0.7) {
        const kk = (k - morph + 0.5) / 1.2;
        g.save(); g.globalCompositeOperation = 'lighter';
        const w = 30 + kk * 60;
        const grd = g.createLinearGradient(x - w, 0, x + w, 0);
        grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, h.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = Math.sin(kk * Math.PI); g.fillStyle = grd; g.fillRect(x - w, 0, w * 2, y);
        g.restore();
      }
    }
    if (k > 7 && k < 7.3) { g.fillStyle = `rgba(255,255,255,${(7.3 - k) * 2})`; g.fillRect(0, 0, W, H); }
    if (k > 9.2) {
      // coloured explosion + title
      const kk = k - 9.2;
      g.save(); g.globalCompositeOperation = 'lighter';
      HEROES.forEach((h, i) => { g.globalAlpha = clamp(1 - kk / 2, 0, 0.6); g.fillStyle = h.color; g.beginPath(); g.arc(xs[i], 470, 80 + kk * 260, 0, 7); g.fill(); });
      g.restore();
      const a = clamp((kk - 0.4) * 2, 0, 1);
      g.globalAlpha = a;
      g.fillStyle = 'rgba(2,6,12,.6)'; g.fillRect(0, 95, W, 150);
      txt('PRIMAL SENTINELS', W / 2, 180, 72, '#fff4d0', 'center', 900);
      txt('IL CUORE DEI TITANI', W / 2, 222, 24, '#ffcf7a', 'center', 900);
      g.globalAlpha = 1;
    }
    if (k < 0.6) { g.fillStyle = `rgba(0,0,0,${1 - k / 0.6})`; g.fillRect(-20, -20, W + 40, H + 40); }
    if (t > INTRO_LEN - 1) { g.fillStyle = `rgba(0,0,0,${t - (INTRO_LEN - 1)})`; g.fillRect(-20, -20, W + 40, H + 40); }
  }
  g.restore();
  letterbox();
  subtitle(t);
  txt('INVIO / PUGNO / A: SALTA', W - 20, 26, 12, '#8a9aac', 'right', 800);
}

/* ---------------- chapter dialogue scenes ---------------- */
function drawDialog(v) {
  const L = LEVELS[v.lv];
  const line = v.lines[v.i] || ['', ''];
  const [who, text] = line;
  const k = v.t;
  // background: the chapter's stage, darkened
  const bgName = v.card ? L.bg : L.bg;
  coverImage(bgName, 1.05 + Math.sin(k * 0.05) * 0.01, v.i % 2 ? 0.2 : 0.6, 0.5);
  g.fillStyle = 'rgba(3,6,14,.55)'; g.fillRect(0, 0, W, H);
  // chapter card
  if (v.card) {
    const a = clamp(Math.min(k * 2, (2.6 - k) * 2), 0, 1);
    g.globalAlpha = a;
    txt(`CAPITOLO ${L.n}`, W / 2, 300, 24, '#ffcf7a', 'center', 900);
    txt(L.title, W / 2, 370, 56, '#f4f6fa', 'center', 900);
    txt(L.place, W / 2, 412, 18, '#9fb4c8', 'center', 800);
    g.globalAlpha = 1;
    return;
  }
  // actors on stage: heroes of the players on the left, speaker on the right if villain
  const heroes = v.heroes && v.heroes.length ? v.heroes : [0];
  heroes.forEach((h, i) => { drawShadow(180 + i * 95, 610, 34); spr('fighters', HEROES[h].id + '_0', 180 + i * 95, 610, { scale: 1.0, face: 1, alpha: 0.95 }); });
  const sp = SPEAKERS[who];
  if (sp && !HEROES.some((h) => h.name === who)) {
    const [sheet, key] = sp;
    const sc = sheet === 'people' ? 1.5 : sheet === 'bosses' ? (who === 'TRIVOR' ? 1.9 : 1.6) : 1.1;
    drawShadow(1020, 620, 60);
    spr(sheet, key, 1020, 620, { scale: sc, face: -1 });
  } else if (sp) {
    // a hero speaks: highlight them
    const idx = heroes.indexOf(HEROES.findIndex((h) => h.name === who));
    const x = idx >= 0 ? 180 + idx * 95 : 1020;
    if (idx < 0) { drawShadow(x, 620, 40); spr('fighters', sp[1], x, 620, { scale: 1.15, face: -1 }); }
    else { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; g.fillStyle = sp[2]; g.beginPath(); g.ellipse(x, 540, 60, 110, 0, 0, 7); g.fill(); g.restore(); }
  }
  // text box
  g.fillStyle = 'rgba(4,10,20,.9)'; g.fillRect(60, H - 190, W - 120, 150);
  const col = sp ? sp[2] : '#ffcf7a';
  g.fillStyle = col; g.fillRect(60, H - 190, W - 120, 3);
  if (who !== 'NARRATORE') txt(who, 90, H - 152, 22, col, 'left', 900);
  const shown = text.slice(0, Math.floor(k * 48));
  const lines = wrapText(shown, W - 200, 24);
  lines.forEach((ln, i) => txt(ln, 90, H - (who !== 'NARRATORE' ? 112 : 140) + i * 34, 24, who === 'NARRATORE' ? '#dfe7ef' : '#f4f6fa', 'left', who === 'NARRATORE' ? 600 : 700));
  if (shown.length >= text.length && Math.floor(k * 2.5) % 2) txt('▼', W - 90, H - 60, 18, '#ffcf7a', 'center', 900);
  txt(`${v.i + 1}/${v.lines.length} · PUGNO / INVIO per continuare · START per saltare`, W - 80, H - 12, 12, '#7e8fa2', 'right', 700);
}

/* ---------------- ending ---------------- */
function drawEnding(t, heroes) {
  coverImage('dawn', 1.1 - Math.min(t, 20) * 0.003, 0.6, 0.5);
  g.fillStyle = `rgba(255,190,120,${0.1 + Math.sin(t * 0.5) * 0.04})`; g.fillRect(0, 0, W, H);
  const tx = 640;
  spr('titans', 'concordia_front', 980, 690, { scale: 1.2, alpha: clamp(t / 3, 0, 0.9) });
  const hs = heroes && heroes.length ? [...new Set([...heroes, 0, 1, 2, 3, 4])] : [0, 1, 2, 3, 4];
  hs.slice(0, 5).forEach((h, i) => { drawShadow(160 + i * 110, 650, 34); spr('fighters', HEROES[h].id + '_0', 160 + i * 110, 650, { scale: 1.0 }); });
  const credits = [
    ['PRIMAL SENTINELS', 'IL CUORE DEI TITANI'],
    ['IDEATO E SVILUPPATO DA', 'b3pZ'],
    ['EROI', 'IGNIS · AZUR · LYRA · AURA · ONYX'],
    ['I TITANI', 'TIRANNO · TRICORNO · FELINO · PTEROSAURO · MASTODONTE'],
    ['E CONCORDIA', 'PERCHÉ HANNO SCELTO NOI'],
    ['GRAZIE PER AVER GIOCATO', 'PORTO AURORA È SALVA'],
  ];
  const idx = Math.floor(t / 4.2);
  const c = credits[Math.min(idx, credits.length - 1)];
  const k = t - idx * 4.2;
  g.globalAlpha = idx >= credits.length - 1 ? 1 : clamp(Math.min(k * 2, (4.2 - k) * 2), 0, 1);
  g.fillStyle = 'rgba(4,8,16,.55)'; g.fillRect(0, 150, W, 130);
  txt(c[0], tx, 205, 22, '#ffcf7a', 'center', 900);
  txt(c[1], tx, 252, 38, '#fff6e6', 'center', 900);
  g.globalAlpha = 1;
  if (t > 26) txt('PREMI INVIO / PUGNO PER TORNARE AL MENU', W / 2, H - 30, 16, '#fff', 'center', 800);
}
