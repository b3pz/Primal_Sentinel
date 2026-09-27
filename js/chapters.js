'use strict';
/* ============================================================
   CINEMATICHE TRA I CAPITOLI — scene animate in tempo reale
   (come l'intro) che raccontano cosa succede tra un capitolo e
   il successivo. Ogni cinematica è una lista di inquadrature:
   { d: durata, sub: [titoletto, testo], cues: [[t, suono]], draw(k, t) }
   ============================================================ */
const ALL5 = [0, 1, 2, 3, 4];

function heroAt(i, f, x, y, sc = 1, face = 1, alpha = 1) {
  drawShadow(x, y, 34 * sc);
  spr('fighters', `${HEROES[i].id}_${f}`, x, y, { scale: sc, face, alpha });
}
function civAt(type, mode, x, y, t, face = 1, sc = 1) {
  const f = mode === 'run' ? `${type}_run${Math.floor(t * 11) % 6}` : mode === 'walk' ? `${type}_walk${Math.floor(t * 7) % 6}` : mode === 'idle' ? `${type}_idle${Math.floor(t * 2) % 2}` : `${type}_${mode}`;
  drawShadow(x, y, 24 * sc);
  spr('people', f, x, y, { scale: sc, face });
}
function lineup(y, t, frame = 0, x0 = 330, gap = 120, sc = 1, walkIn = 0) {
  ALL5.forEach((i) => {
    const x = x0 + i * gap - (walkIn ? (1 - clamp(walkIn, 0, 1)) * 500 : 0);
    const f = walkIn && walkIn < 1 ? [1, 2, 3, 2][Math.floor(t * 8 + i) % 4] : frame;
    heroAt(i, f, x, y + (i % 2) * 22, sc);
  });
}
function glowAt(x, y, r, color, a = 0.6) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(x, y, 2, x, y, r);
  grd.addColorStop(0, color); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = a; g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
function sigil(x, y, t, a = 1) {
  g.save(); g.translate(x, y); g.scale(1, 0.32); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  g.strokeStyle = '#ffcf6a'; g.lineWidth = 6;
  g.beginPath(); g.arc(0, 0, 120, 0, 7); g.stroke();
  g.rotate(t * 0.6);
  for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2; g.strokeStyle = HEROES[i].color; g.beginPath(); g.moveTo(Math.cos(an) * 30, Math.sin(an) * 30); g.lineTo(Math.cos(an) * 110, Math.sin(an) * 110); g.stroke(); g.fillStyle = HEROES[i].color; g.beginPath(); g.arc(Math.cos(an) * 110, Math.sin(an) * 110, 12, 0, 7); g.fill(); }
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(-60, -40); g.lineTo(0, 50); g.lineTo(60, -40); g.stroke();
  g.restore();
}
function tintScreen(color, a, mode = 'source-over') { g.save(); g.globalCompositeOperation = mode; g.globalAlpha = a; g.fillStyle = color; g.fillRect(0, 0, W, H); g.restore(); }
function silhouette(sheet, key, x, y, sc, face, color, a) { spr(sheet, key, x, y, { scale: sc, face, img: tinted(sheet, key, color, 'source-atop', 0.9), alpha: a }); }
function ghost(sheet, key, x, y, sc, face, a, color = '#b77dff') {
  g.save(); g.globalCompositeOperation = 'lighter';
  spr(sheet, key, x, y, { scale: sc, face, img: tinted(sheet, key, color, 'source-atop', 0.55), alpha: a });
  g.restore();
}
function water(y, t, color = 'rgba(20,40,80,.8)') {
  g.fillStyle = color; g.fillRect(0, y, W, H - y);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,200,140,.25)';
  for (let i = 0; i < 30; i++) { const x = (i * 97 + t * 40) % W; g.fillRect(x, y + 8 + (i % 5) * 14, 40 + (i % 3) * 20, 2); }
  g.restore();
}
function mirror(x, y, w, h, t, content) {
  g.save();
  g.fillStyle = '#05070c'; g.fillRect(x - 10, y - 10, w + 20, h + 20);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(x - 6, y - 6, w + 12, h + 12);
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  content();
  // cracks
  g.strokeStyle = 'rgba(230,210,255,.8)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x + w * 0.3, y); g.lineTo(x + w * 0.45, y + h * 0.4); g.lineTo(x + w * 0.2, y + h); g.moveTo(x + w * 0.45, y + h * 0.4); g.lineTo(x + w, y + h * 0.55); g.stroke();
  g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(160,90,255,.18)'; g.fillRect(x, y, w, h);
  g.restore();
}
function fireGlow(t) { for (let i = 0; i < 6; i++) glowAt((i * 230 + 60) % W, 330 + Math.sin(t * 3 + i) * 20, 160, '#ff6a2a', 0.18); }

const CHAPTER_CINES = [
  // ---- after chapter 1 → Il convoglio dei prigionieri
  [
    { d: 6.5, sub: ['PORTO AURORA · ALL\'ALBA', 'Tra i resti di Mastice brilla un simbolo: lo stesso inciso sulle armature dei Sentinels.'], cues: [[0.3, 'boom'], [2.2, 'morph']],
      draw(k, t) {
        drawStageBackdrop('port', 3300);
        tintScreen('#1a2a4a', 0.25);
        const a = clamp(1 - k / 2.5, 0, 1);
        spr('bosses', 'mastice_7', 820, 640, { scale: 0.8, face: -1, alpha: a });
        if (a > 0) for (let i = 0; i < 3; i++) glowAt(760 + i * 60, 520 - (k * 40) % 60, 60, '#6a6a7a', 0.3 * a);
        sigil(820, 640, t, clamp((k - 1.5) / 1.5, 0, 1));
        glowAt(820, 610, 200, '#ffcf6a', clamp((k - 1.5) / 1.5, 0, 0.35));
        ALL5.forEach((i) => heroAt(i, k > 4 ? 0 : [1, 2, 3, 2][Math.floor(t * 8 + i) % 4], 120 + i * 90 + Math.min(k, 4) * 60, 580 + (i % 2) * 40, 0.9));
      } },
    { d: 7, sub: ['STAZIONE MERCI', 'Intanto i Senzavolto caricano i prigionieri su un convoglio blindato.'], cues: [[0.5, 'siren'], [4, 'laser']],
      draw(k, t) {
        drawStageBackdrop('rail', 200);
        rift(1150, 520, 0.6 + Math.sin(t * 3) * 0.05, t);
        const people = ['elder', 'girl', 'scientist', 'kid', 'suit', 'fisher'];
        people.forEach((p, i) => civAt(p, 'walk', 120 + i * 120 + k * 70, 600 + (i % 2) * 30, t + i, 1, 0.95));
        [0, 1, 2].forEach((i) => { const x = 40 + i * 330 + k * 70; drawShadow(x, 640, 34); spr('fighters', `soldier_${[1, 2, 3, 2][Math.floor(t * 7 + i) % 4]}`, x, 640, { scale: 0.86 }); });
      } },
    { d: 5.5, sub: ['', 'Tra i prigionieri c\'è una scienziata. E il treno corre verso il portale.'], cues: [[0.5, 'wind']],
      draw(k, t) {
        drawStageBackdrop('rail', 900);
        tintScreen('#200030', 0.35);
        glowAt(640, 360, 420, '#8a3ad0', 0.35 + Math.sin(t * 4) * 0.1);
        civAt('scientist', 'point', 640, 690, t, -1, 2.6);
      } },
  ],
  // ---- after chapter 2 → La foresta di acciaio
  [
    { d: 6, sub: ['DOTT.SSA IRENE VALLI', '«Ho studiato le vostre armature per vent\'anni, senza sapere cosa fossero.»'], cues: [],
      draw(k, t) {
        drawStageBackdrop('rail', 3200);
        tintScreen('#0a1830', 0.3);
        lineup(600, t, 0, 140, 105, 0.95);
        civAt('scientist', 'idle', 900, 640, t, -1, 1.5);
        glowAt(900, 470, 120, '#9fd6ff', 0.25);
      } },
    { d: 7, sub: ['IL VECCHIO PARCO PREISTORICO', 'Sotto il recinto del tirannosauro, qualcosa respira.'], cues: [[1, 'stomp'], [2.6, 'stomp'], [4.2, 'stomp'], [5.8, 'stomp']],
      draw(k, t) {
        const beat = Math.max(0, Math.sin(t * Math.PI / 0.8)) ** 8;
        g.save(); g.translate(rand(-1, 1) * beat * 6, 0);
        drawStageBackdrop('park', 400);
        tintScreen('#050a14', 0.35);
        silhouette('titans', 'rex_side', 640, 900 - Math.min(k, 6) * 30, 1.9, 1, '#200808', 0.8);
        glowAt(640, 620, 380, '#ff3a2a', 0.15 + beat * 0.45);
        g.restore();
      } },
    { d: 5, sub: ['', 'Il primo titano si sta svegliando. E Vespera lo sa.'], cues: [[0.2, 'confirm']],
      draw(k, t) {
        drawStageBackdrop('park', 60);
        ALL5.forEach((i) => heroAt(i, [1, 2, 3, 2][Math.floor(t * 12 + i) % 4], -80 + k * 260 + i * 100, 580 + (i % 2) * 40, 0.95));
      } },
  ],
  // ---- after chapter 3 → Il teatro degli specchi
  [
    { d: 7, sub: ['VESPERA', '«Inginocchiati, mio guardiano.» Per un istante il titano obbedisce.'], cues: [[0.5, 'laser'], [2, 'bosswind']],
      draw(k, t) {
        drawStageBackdrop('park', 1500);
        tintScreen('#2a0a50', 0.45);
        ghost('bosses', 'vespera_3', 900, 700, 3.4, -1, clamp(k / 1.5, 0, 0.5));
        const obey = clamp((k - 1.5) / 1, 0, 1);
        spr('titans', 'rex_side', 480, 690, { scale: 1.6, rot: obey * 0.12, img: obey > 0 ? tinted('titans', 'rex_side', '#9a3aff', 'source-atop', 0.45 * obey) : null });
      } },
    { d: 5.5, sub: ['', 'Poi si scuote e ruggisce contro il cielo. Ma adesso sappiamo che lei lo conosce.'], cues: [[0.4, 'boom'], [0.6, 'stomp']],
      draw(k, t) {
        drawStageBackdrop('park', 1500);
        tintScreen('#0a0a20', 0.25);
        const sh = k < 1 ? 8 : 0;
        spr('titans', 'rex_side', 480 + rand(-1, 1) * sh, 690, { scale: 1.6, rot: -0.1 * Math.sin(Math.min(k, 1) * Math.PI) });
        if (k < 1) tintScreen('#ffffff', (1 - k) * 0.6);
        ALL5.forEach((i) => heroAt(i, 4, 850 + i * 80, 650 + (i % 2) * 30, 0.7, -1));
      } },
    { d: 6.5, sub: ['IL QUARTIERE DEL VELO', 'In città ogni specchio riflette qualcuno che non c\'è.'], cues: [[1, 'laser'], [3, 'laser']],
      draw(k, t) {
        drawStageBackdrop('theater', 300);
        ALL5.forEach((i) => {
          const out = clamp((k - 1 - i * 0.6) / 0.8, 0, 1);
          if (!out) return;
          const x = 200 + i * 220;
          glowAt(x, 470, 110, '#b77dff', (1 - out) * 0.8);
          spr('fighters', `${HEROES[i].id}_${out < 1 ? 4 : 0}`, x, 640, { scale: 1.0, face: -1, img: tinted('fighters', `${HEROES[i].id}_${out < 1 ? 4 : 0}`, '#3a1466', 'source-atop', 0.62), alpha: out });
        });
      } },
  ],
  // ---- after chapter 4 → Assedio a Porto Aurora
  [
    { d: 7, sub: ['NEGLI SPECCHI INFRANTI', 'Immagini vere: i cinque titani che radono al suolo le città di un altro mondo.'], cues: [[1, 'boom'], [3.5, 'boom']],
      draw(k, t) {
        coverImage('theater', 1.05, 0.5, 0.5);
        tintScreen('#000', 0.55);
        [[140, 140, 'rex_side'], [520, 110, 'mammoth_side'], [900, 140, 'tri_side']].forEach(([x, y, key], i) => mirror(x, y, 320, 300, t, () => {
          coverImage('siege', 1.3, (i * 0.4) % 1, 0.3);
          tintScreen('#3a0000', 0.3);
          silhouette('titans', key, x + 160 + Math.sin(t + i) * 10, y + 300, 0.75, i % 2 ? -1 : 1, '#200a0a', 0.95);
          glowAt(x + 160, y + 200, 160, '#ff6a2a', 0.3);
        }));
        ALL5.forEach((i) => heroAt(i, 7, 250 + i * 190, 690, 0.9, 1, 0.95));
      } },
    { d: 5, sub: ['LYRA', '«...Non può essere vero.»'], cues: [],
      draw(k, t) {
        coverImage('theater', 1.3, 0.5, 0.6);
        tintScreen('#000', 0.45);
        spr('fighters', 'lyra_7', 640, 760, { scale: 2.6, face: -1 });
      } },
    { d: 7, sub: ['PORTO AURORA', 'Kharon guida l\'assedio finale. La città brucia.'], cues: [[0.5, 'siren'], [3, 'boom'], [5, 'boom']],
      draw(k, t) {
        drawStageBackdrop('siege', 500);
        fireGlow(t);
        spr('bosses', `kharon_${k > 4 ? 3 : 0}`, 900, 560, { scale: 1.9, face: -1 });
        [0, 1, 2, 3].forEach((i) => { const x = 100 + i * 160 + k * 50; drawShadow(x, 660, 34); spr('fighters', `${i % 2 ? 'brute' : 'soldier'}_${[1, 2, 3, 2][Math.floor(t * 7 + i) % 4]}`, x, 660, { scale: i % 2 ? 1.02 : 0.86 }); });
      } },
  ],
  // ---- after chapter 5 → Il cimitero dei titani
  [
    { d: 7, sub: ['CONCORDIA', 'Il colosso cade in mare. La città è salva, per ora.'], cues: [[0.5, 'stomp'], [3, 'team']],
      draw(k, t) {
        coverImage('siege', 1.08, 0.5, 0.35);
        tintScreen('#301040', 0.2);
        glowAt(640, 250, 500, '#ffb070', 0.3);
        spr('titans', 'concordia_front', 640, 820 - Math.min(k, 3) * 20, { scale: 1.25 });
        water(600, t);
      } },
    { d: 5, sub: ['KHARON', 'Nella luce dell\'esplosione Kharon esita. Poi scompare nel Velo.'], cues: [[1, 'laser']],
      draw(k, t) {
        drawStageBackdrop('siege', 1200);
        tintScreen('#100020', 0.35);
        rift(760, 400, clamp(k / 1.5, 0, 1), t);
        spr('bosses', 'kharon_0', 760, 640, { scale: 1.8, face: -1, alpha: clamp(1 - (k - 2) / 2, 0, 1) });
      } },
    { d: 7, sub: ['SOTTO IL PORTO', 'Le incisioni portano giù, in una fabbrica sepolta: un cimitero di titani.'], cues: [[1, 'stomp']],
      draw(k, t) {
        coverImage('graveyard', 1.15, 0.5, 0.6);
        tintScreen('#000', 0.2);
        ALL5.forEach((i) => heroAt(i, [1, 2, 3, 2][Math.floor(t * 8 + i) % 4], 200 + i * 80 + k * 50, 690, 0.75));
        for (let i = 0; i < 4; i++) glowAt(150 + i * 330, 380, 70, '#ffb040', 0.35 + Math.sin(t * 7 + i) * 0.1);
      } },
  ],
  // ---- after chapter 6 → Oltre il Velo
  [
    { d: 6.5, sub: ['KHARON', '«Mille anni fa ero il primo pilota dei titani.»'], cues: [],
      draw(k, t) {
        drawStageBackdrop('graveyard', 3200);
        tintScreen('#000', 0.25);
        lineup(620, t, 0, 120, 100, 0.95);
        spr('bosses', 'kharon_5', 950, 650, { scale: 1.8, face: -1 });
      } },
    { d: 7, sub: ['MILLE ANNI FA', '«Fui io a liberare i titani da Vespera. Lei mi punì con questa corazza.»'], cues: [[1.5, 'laser'], [3, 'bosswind']],
      draw(k, t) {
        coverImage('veil', 1.1, 0.5, 0.5);
        ['rex_side', 'tri_side', 'cat_side', 'ptero_side', 'mammoth_side'].forEach((key, i) => silhouette('titans', key, 150 + i * 250, 520 + (i % 2) * 50, 0.6, i % 2 ? -1 : 1, '#1a1008', 0.9));
        ghost('bosses', 'vespera_4', 900, 700, 2.6, -1, 0.45);
        spr('bosses', 'kharon_0', 460, 700, { scale: 2.0 });
        // chains of light
        const c = clamp((k - 2.5) / 1.5, 0, 1);
        if (c) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#c07bff'; g.lineWidth = 5; g.globalAlpha = c; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(460, 380 + i * 70, 120, 26, Math.sin(t + i) * 0.2, 0, 7); g.stroke(); } g.restore(); }
        tintScreen('#704214', 0.8, 'color');
        tintScreen('#000', 0.15);
      } },
    { d: 6, sub: ['', '«Finché la indosso devo obbedirle. Distruggetela, oltre il Velo.» Il portale si apre.'], cues: [[0.5, 'laser'], [2, 'morph']],
      draw(k, t) {
        drawStageBackdrop('graveyard', 3400);
        rift(760, 330, clamp(k / 2, 0, 1), t);
        glowAt(760, 330, 420, '#8a3ad0', clamp(k / 2, 0, 0.5));
        ALL5.forEach((i) => heroAt(i, [1, 2, 3, 2][Math.floor(t * 8 + i) % 4], 200 + i * 90 + k * 60, 620 + (i % 2) * 40, 0.95, 1, clamp(1 - (k - 4.5), 0, 1)));
      } },
  ],
  // ---- after chapter 7 → L'ultima alba
  [
    { d: 6, sub: ['KHARON', '«La corazza si è spezzata. Sono libero. Grazie, Sentinels.»'], cues: [[0.5, 'boom'], [0.7, 'heavy']],
      draw(k, t) {
        drawStageBackdrop('veil', 3200);
        const f = clamp(1 - k / 1.2, 0, 1);
        spr('bosses', 'kharon_0', 760, 650, { scale: 1.9, face: -1, flash: f });
        if (k < 1.5) for (let i = 0; i < 6; i++) glowAt(760 + rand(-80, 80), rand(350, 600), 50, '#ffd6ff', 0.5 * f);
        lineup(640, t, 0, 90, 90, 0.85);
      } },
    { d: 7.5, sub: ['VESPERA', '«Che commovente. E adesso, miei titani... tornate da me.»'], cues: [[1, 'laser'], [2.5, 'stomp'], [4, 'stomp']],
      draw(k, t) {
        coverImage('veil', 1.05, 0.5, 0.5);
        tintScreen('#2a0050', 0.35);
        ['rex_side', 'tri_side', 'cat_side', 'ptero_side', 'mammoth_side'].forEach((key, i) => {
          const rise = clamp((k - 1 - i * 0.4) / 2.5, 0, 1);
          spr('titans', key, 150 + i * 240, 740 - rise * 260, { scale: 0.62, face: i % 2 ? -1 : 1, img: tinted('titans', key, '#9a3aff', 'source-atop', 0.55 * rise), alpha: 0.95 });
        });
        spr('bosses', `vespera_${k > 1 && k < 5 ? 4 : 3}`, 640, 470, { scale: 1.6, face: -1 });
        glowAt(640, 360, 300, '#b77dff', 0.3 + Math.sin(t * 5) * 0.1);
      } },
    { d: 6.5, sub: ['L\'ULTIMA ALBA', 'Per salvarli bisogna raggiungere i loro Cuori dall\'interno della fortezza.'], cues: [[0.3, 'confirm']],
      draw(k, t) {
        drawStageBackdrop('dawn', 300);
        ALL5.forEach((i) => heroAt(i, [1, 2, 3, 2][Math.floor(t * 13 + i) % 4], -60 + k * 220 + i * 95, 600 + (i % 2) * 40, 0.95));
      } },
  ],
  // ---- after chapter 8 → finale (before the credits)
  [
    { d: 7, sub: ['CONCORDIA ALBA', 'Il Velo si richiude per sempre. Sul mare di Porto Aurora sorge il sole.'], cues: [[0.3, 'boom'], [3, 'team']],
      draw(k, t) {
        coverImage('dawn', 1.1, 0.6, 0.5);
        glowAt(640, 300, 520, '#ffd08a', 0.35 + Math.sin(t) * 0.05);
        spr('bosses', 'eclipse_5', 980, 690, { scale: 1.6, face: -1, alpha: clamp(1 - k / 2.5, 0, 1), img: tinted('bosses', 'eclipse_5', '#ffffff', 'source-atop', clamp(k / 2.5, 0, 1)) });
        spr('titans', 'concordia_front', 470, 740, { scale: 1.2 });
      } },
    { d: 7, sub: ['PORTO AURORA · IL GIORNO DOPO', 'La città si risveglia. I Sentinels tornano a essere cinque persone qualunque.'], cues: [[0.5, 'crowd'], [3, 'crowd']],
      draw(k, t) {
        drawStageBackdrop('port', 400);
        tintScreen('#ffb070', 0.18, 'lighter');
        ['waiter', 'lady', 'kid', 'fisher', 'elder', 'girl'].forEach((c, i) => civAt(c, i % 2 ? 'point' : 'idle', 90 + i * 70 + (i > 2 ? 830 : 0), 560 + (i % 3) * 40, t + i, i > 2 ? -1 : 1));
        ALL5.forEach((i) => civAt(HEROES[i].id + 'C', k > 4 ? 'raise' : 'idle', 470 + i * 85, 640 + (i % 2) * 20, t, 1, 1.1));
      } },
    { d: 6.5, sub: ['', 'I titani tornano a dormire sotto la città. Questa volta, come custodi.'], cues: [[0.5, 'morph']],
      draw(k, t) {
        coverImage('story_cores', 1.02, 0.5, 0.45);
        const CAPS = [266, 354, 443, 531, 620];
        HEROES.forEach((h, i) => { const [x, y] = coverPoint('story_cores', 1.02, 0.5, 0.45, CAPS[i], 243); glowAt(x, y, 110, h.color, 0.45 + Math.sin(t * 2 + i) * 0.15); });
      } },
  ],
];
const CINE_FADE = 0.55;
function cineLength(id) { return CHAPTER_CINES[id].reduce((a, s) => a + s.d, 0); }
function cineShot(id, t) {
  let acc = 0;
  for (const [i, s] of CHAPTER_CINES[id].entries()) { if (t < acc + s.d) return [s, t - acc, i]; acc += s.d; }
  const list = CHAPTER_CINES[id];
  return [list[list.length - 1], list[list.length - 1].d, list.length - 1];
}
function cineSounds(id, t0, t1) {
  let acc = 0;
  for (const s of CHAPTER_CINES[id]) {
    for (const [ct, n] of s.cues || []) if (acc + ct > t0 && acc + ct <= t1) Audio.sfx(n);
    acc += s.d;
  }
}
function drawChapterCine(id, t) {
  const [s, k, idx] = cineShot(id, t);
  g.save();
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  s.draw(k, t);
  g.restore();
  // shot transitions: fade from/to black
  const a = Math.max(clamp(1 - k / CINE_FADE, 0, 1), clamp(1 - (s.d - k) / CINE_FADE, 0, 1));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
  letterbox();
  // subtitle with typewriter
  const [head, body] = s.sub || ['', ''];
  if (body) {
    const ka = clamp(Math.min(k - 0.3, s.d - k - 0.2) * 3, 0, 1);
    g.globalAlpha = ka;
    g.fillStyle = 'rgba(2,6,12,.75)'; g.fillRect(0, H - 124, W, 96);
    if (head) ptxt(head, W / 2, H - 92, 11, '#ffcf7a', 'center');
    const shown = body.slice(0, Math.floor((k - 0.3) * 44));
    const lines = wrapText(shown, W - 160, 22);
    lines.forEach((ln, i) => txt(ln, W / 2, H - 58 + i * 28 - (lines.length - 1) * 12, 22, '#f2f6fa', 'center', 700));
    g.globalAlpha = 1;
  }
  ptxt('PUGNO / INVIO: SALTA', W - 20, 26, 8, '#8a9aac', 'right');
  ptxt(`${idx + 1}/${CHAPTER_CINES[id].length}`, 20, 26, 8, '#8a9aac', 'left');
}

/* ============================================================
   CINEMATICHE DEI TITANI (prima dei duelli giganti)
   ============================================================ */
const BEASTS = ['rex', 'tri', 'cat', 'ptero', 'mammoth'];
const BEAST_COL = ['#ff4a3d', '#3f86ff', '#ffd13a', '#ff5fae', '#d9e2ec'];
function beast(n, pose, x, y, sc = 1, face = 1, alpha = 1) { drawShadow(x, y, 120 * sc); spr('giants', `beast_${n}_${pose}`, x, y, { scale: sc, face, alpha }); }
function stillArt(name, t, shakeV = 0) {
  g.save(); if (shakeV) g.translate(rand(-1, 1) * shakeV, rand(-1, 1) * shakeV);
  coverImage(name, 1.0, 0.5, 0.5); g.restore();
}
/* the combination sequence: 6 stages, a flash between each */
function combineSeq(k, dur, gold) {
  g.fillStyle = gold ? '#1a0e04' : '#05070c'; g.fillRect(0, 0, W, H);
  const n = 6, st = Math.min(n - 1, Math.floor(k / (dur / n))), kk = (k % (dur / n)) / (dur / n);
  // rays behind
  g.save(); g.globalCompositeOperation = 'lighter';
  BEAST_COL.forEach((c, i) => { g.fillStyle = c; g.globalAlpha = 0.18; g.beginPath(); g.moveTo(W / 2, 400); const a = -Math.PI / 2 + (i - 2) * 0.45 + Math.sin(k + i) * 0.05; g.lineTo(W / 2 + Math.cos(a - 0.12) * 1200, 400 + Math.sin(a - 0.12) * 1200); g.lineTo(W / 2 + Math.cos(a + 0.12) * 1200, 400 + Math.sin(a + 0.12) * 1200); g.fill(); });
  g.restore();
  glowAt(W / 2, 420, 380, gold ? '#ffd08a' : '#9fd6ff', 0.3);
  spr('giants', 'combo_' + st, W / 2, 690, { scale: 1.0, flash: kk < 0.15 ? 1 - kk / 0.15 : 0 });
  if (kk < 0.08 && st > 0) { g.fillStyle = `rgba(255,255,255,${1 - kk / 0.08})`; g.fillRect(0, 0, W, H); }
  const labels = ['I CINQUE TITANI SPICCANO IL SALTO', 'TRICORNO E FELINO: LE GAMBE', 'TIRANNO ROSSO: IL CORPO', 'MASTODONTE: LE BRACCIA', 'PTEROSAURO: ALI E SCUDO', gold ? 'CONCORDIA ALBA!' : 'CONCORDIA!'];
  ptitle(labels[st], W / 2, 90, st === 5 ? 44 : 22, '#fff6d6', gold ? '#ffd35a' : '#ffb03a');
}
CHAPTER_CINES.awake = [
  { d: 5.5, sub: ['SOTTO IL PARCO PREISTORICO', 'Cinque titani dormono da millenni. Uno di loro sta per svegliarsi.'], cues: [[1, 'stomp'], [3, 'stomp']],
    draw(k, t) {
      stillArt('cine_cavern', t);
      const beat = Math.max(0, Math.sin(t * Math.PI / 0.9)) ** 8;
      glowAt(160, 330, 150, '#ff3a2a', 0.2 + beat * 0.5);
    } },
  { d: 6, sub: ['', 'Il Tiranno rosso apre gli occhi e si alza.'], cues: [[1.8, 'stomp'], [3.6, 'stomp'], [4.3, 'boom']],
    draw(k, t) {
      drawStageBackdrop('park', 1500);
      tintScreen('#0a0612', 0.35);
      const pose = k < 1.8 ? 'sleep' : k < 3.8 ? 'wake' : 'roar';
      g.save(); if (k > 4.3 && k < 5.2) g.translate(rand(-1, 1) * 8, rand(-1, 1) * 8);
      beast('rex', pose, 640, 650, 1.7);
      g.restore();
      if (k > 1.8) glowAt(760, 300, 90, '#ffe060', 0.4);
      ALL5.forEach((i) => heroAt(i, 0, 150 + i * 70, 690, 0.7));
    } },
  { d: 5.5, sub: ['IGNIS', '«Ha risposto al mio Cuore! TIRANNO ROSSO, IN PIEDI!»'], cues: [[0.3, 'boom'], [0.5, 'team']],
    draw(k, t) { stillArt('cine_rex', t, k < 1 ? (1 - k) * 10 : 0); } },
];
CHAPTER_CINES.union = [
  { d: 5.5, sub: ['PORTO AURORA IN FIAMME', 'Cinque Cuori chiamano. Cinque titani rispondono, attraversando la città.'], cues: [[0.5, 'stomp'], [1.6, 'stomp'], [2.7, 'stomp'], [3.8, 'stomp']],
    draw(k, t) { stillArt('cine_run', t, Math.max(0, Math.sin(t * 5.7)) * 3); } },
  { d: 5, sub: ['', 'Uno dopo l\'altro, i titani corrono verso il mare.'], cues: [[0.4, 'stomp'], [1.2, 'stomp'], [2, 'stomp']],
    draw(k, t) {
      drawStageBackdrop('siege', 1200);
      tintScreen('#10040a', 0.3);
      BEASTS.forEach((n, i) => {
        const x = -300 + (k - i * 0.35) * 520;
        const y = n === 'ptero' ? 420 : 560 + (i % 2) * 90;
        beast(n, 'run', x, y, 1.0);
      });
    } },
  { d: 7.2, sub: ['', ''], cues: [[0.1, 'morph'], [1.2, 'heavy'], [2.4, 'heavy'], [3.6, 'heavy'], [4.8, 'heavy'], [6, 'team']],
    draw(k, t) { combineSeq(k, 7.2, false); } },
  { d: 5, sub: ['LA CABINA DI CONCORDIA', 'Cinque mani sui Cuori. Un solo battito.'], cues: [[0.5, 'confirm']],
    draw(k, t) { stillArt('cine_cockpit', t); } },
  { d: 5, sub: ['CONCORDIA', 'Contro il colosso risorto dal mare di Porto Aurora.'], cues: [[0.3, 'stomp'], [0.8, 'siren']],
    draw(k, t) { stillArt('cine_duel', t); } },
];
CHAPTER_CINES.final = [
  { d: 5.5, sub: ['I TITANI SONO LIBERI', 'Nessuno li comanda più. Ognuno sceglie da che parte stare.'], cues: [[0.6, 'stomp'], [2, 'stomp']],
    draw(k, t) {
      coverImage('dawn', 1.05, 0.5, 0.5);
      tintScreen('#2a0030', 0.45);
      BEASTS.forEach((n, i) => { const on = clamp((k - i * 0.6) * 2, 0, 1); beast(n, on >= 1 && k > 3 + i * 0.2 ? 'roar' : 'wake', 150 + i * 245, n === 'ptero' ? 470 : 640, 0.85, 1, on); if (on) glowAt(150 + i * 245, 520, 110, BEAST_COL[i], 0.25); });
    } },
  { d: 6.5, sub: ['', ''], cues: [[0.1, 'morph'], [1.1, 'heavy'], [2.2, 'heavy'], [3.3, 'heavy'], [4.4, 'heavy'], [5.4, 'team']],
    draw(k, t) { combineSeq(k, 6.5, true); } },
  { d: 4.5, sub: ['CONCORDIA ALBA', '«Questa volta combattiamo insieme. Per scelta.»'], cues: [[0.5, 'confirm']],
    draw(k, t) { stillArt('cine_cockpit', t); tintScreen('#ffcf6a', 0.12, 'lighter'); } },
];
// the finale ends on the five titans at dawn
CHAPTER_CINES[7][2] = { d: 6.5, sub: ['', 'I titani tornano a dormire sotto la città. Questa volta, come custodi.'], cues: [[0.5, 'morph']],
  draw(k, t) { stillArt('cine_dawn', t); } };
const MID_CINE = { 2: 'awake', 4: 'union', 7: 'final' };
