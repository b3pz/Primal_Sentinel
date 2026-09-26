'use strict';
/* ============================================================
   RENDER — disegna una "view" (livello o duello gigante),
   particelle locali generate dagli eventi, HUD.
   ============================================================ */
const FX = { parts: [], shake: 0, flash: 0, flashC: '#fff', team: null, go: 0 };
const HORIZON = 465;

function applyEvents(evs, world = true) {
  for (const e of evs || []) {
    switch (e.t) {
      case 'snd': Audio.sfx(e.n); break;
      case 'shake': FX.shake = Math.max(FX.shake, e.v); break;
      case 'flash': FX.flash = Math.max(FX.flash, e.v); FX.flashC = e.c || '#fff'; break;
      case 'spark': case 'chip': case 'fire': case 'trail': case 'slash': case 'dust': {
        const n = e.n || 10;
        for (let i = 0; i < n; i++) {
          const big = e.big ? 2.2 : 1;
          FX.parts.push({
            k: e.t, x: e.x, y: e.y, vx: rand(-1, 1) * (e.t === 'trail' ? 20 : e.t === 'fire' ? 160 : 380) * big, vy: (e.t === 'fire' ? rand(-260, -60) : rand(-330, 60)) * big,
            life: rand(0.25, 0.5) * (e.t === 'fire' ? 1.6 : 1), max: 0.5, c: e.c, s: (e.t === 'chip' ? 6 : e.t === 'fire' ? 8 : 5) * big, world: !e.fixed && world,
          });
        }
        if (e.t === 'spark' || e.t === 'slash') FX.parts.push({ k: 'star', x: e.x, y: e.y, life: 0.12, max: 0.12, c: e.c, s: e.big ? 70 : 34, world });
        break;
      }
      case 'ring': FX.parts.push({ k: 'ring', x: e.x, y: e.y, r: e.r, life: e.life, max: e.life, c: e.c, world }); break;
      case 'boom':
        FX.parts.push({ k: 'boom', x: e.x, y: e.y, life: 0.55, max: 0.55, s: e.big ? 2.2 : 1, world });
        for (let i = 0; i < (e.big ? 18 : 12); i++) FX.parts.push({ k: 'fire', x: e.x, y: e.y, vx: rand(-300, 300), vy: rand(-400, -50), life: rand(0.3, 0.7), max: 0.7, c: pick(['#ffd35a', '#ff8a3a', '#ff5a2a']), s: e.big ? 14 : 8, world });
        break;
      case 'beam': FX.parts.push({ k: 'beam', x: e.x, y: e.y, dir: e.dir, len: e.len, c: e.c, life: e.big ? 0.8 : 0.4, max: e.big ? 0.8 : 0.4, big: e.big, world }); break;
      case 'crack': FX.parts.push({ k: 'crack', x: e.x, y: e.y, life: 1.2, max: 1.2, seed: Math.random() * 1000, world }); break;
      case 'txt': FX.parts.push({ k: 'txt', x: e.x, y: e.y, s: e.s, c: e.c, size: e.size || 22, life: e.fixed ? 2 : 1.1, max: e.fixed ? 2 : 1.1, world: !e.fixed && world }); break;
      case 'debris':
        for (let i = 0; i < 4; i++) FX.parts.push({ k: 'plank', x: e.x, y: e.y - 30, vx: rand(-260, 260), vy: rand(-420, -200), life: 0.9, max: 0.9, f: e.k === 'bin' ? 'can' : 'plank' + i, rot: rand(0, 6), vr: rand(-12, 12), world });
        break;
      case 'team': FX.team = { t: 0, heroes: e.heroes }; break;
      case 'go': FX.go = 4; Audio.sfx('confirm'); break;
      case 'shock': break;
      case 'morph': FX.parts.push({ k: 'column', x: e.x, y: e.y, c: e.c, life: 1.1, max: 1.1, world }); break;
    }
  }
}

function stepFX(dt) {
  for (const p of FX.parts) {
    p.life -= dt;
    if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.k !== 'fire' && p.k !== 'trail') p.vy += 900 * dt; else p.vy *= 0.96; }
    if (p.rot !== undefined) p.rot += p.vr * dt;
    if (p.k === 'txt') p.y -= 50 * dt;
  }
  FX.parts = FX.parts.filter((p) => p.life > 0);
  FX.shake = Math.max(0, FX.shake - dt * 40);
  FX.flash = Math.max(0, FX.flash - dt * 2.2);
  FX.go = Math.max(0, FX.go - dt);
  if (FX.team) { FX.team.t += dt; if (FX.team.t > 1.6) FX.team = null; }
}

function drawParts(cam, layer) {
  for (const p of FX.parts) {
    const x = p.world ? p.x - cam : p.x, y = p.y;
    const k = clamp(p.life / p.max, 0, 1);
    g.save();
    switch (p.k) {
      case 'spark': case 'chip': case 'dust':
        g.globalAlpha = k; g.fillStyle = p.k === 'dust' ? '#a8a0a0' : p.c;
        g.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s); break;
      case 'fire': case 'trail':
        g.globalAlpha = k * 0.9; g.globalCompositeOperation = 'lighter'; g.fillStyle = p.c;
        g.beginPath(); g.arc(x, y, p.s * (0.5 + k), 0, 7); g.fill(); break;
      case 'star': {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.fillStyle = '#fffbe8'; g.strokeStyle = p.c; g.lineWidth = 3;
        const r = p.s * (1.2 - k * 0.4);
        g.beginPath();
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r * 0.28 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
        g.closePath(); g.fill(); g.stroke(); break;
      }
      case 'slash':
        g.globalAlpha = k; g.strokeStyle = p.c; g.lineWidth = 4; g.globalCompositeOperation = 'lighter';
        g.beginPath(); g.arc(x, y, 40, -1.2, 0.8); g.stroke(); break;
      case 'ring':
        g.globalAlpha = k; g.strokeStyle = p.c; g.lineWidth = 7 * k + 2; g.globalCompositeOperation = 'lighter';
        g.beginPath(); g.ellipse(x, y, p.r * (1 - k * 0.85), p.r * 0.36 * (1 - k * 0.85), 0, 0, 7); g.stroke(); break;
      case 'boom': {
        const r = (1 - k) * 90 * p.s + 20;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = k; g.fillStyle = '#ffdb7a'; g.beginPath(); g.arc(x, y, r * 0.6, 0, 7); g.fill();
        g.fillStyle = '#ff7a2a'; g.globalAlpha = k * 0.7; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = (1 - k) * 0.5 * k * 3; g.fillStyle = '#2a2230'; g.beginPath(); g.arc(x, y - r * 0.4, r * 0.8, 0, 7); g.fill();
        break;
      }
      case 'beam': {
        const w = (p.big ? 90 : 40) * k;
        const x2 = x + p.dir * p.len;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.6 * k; g.fillStyle = p.c; g.fillRect(Math.min(x, x2), y - w, Math.abs(x2 - x), w * 2);
        g.globalAlpha = k; g.fillStyle = '#ffffff'; g.fillRect(Math.min(x, x2), y - w * 0.3, Math.abs(x2 - x), w * 0.6);
        break;
      }
      case 'crack': {
        g.globalAlpha = Math.min(1, k * 2); g.strokeStyle = '#1a1010'; g.lineWidth = 3;
        let s = p.seed;
        const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
        for (let i = 0; i < 7; i++) {
          g.beginPath(); g.moveTo(x, y);
          let cx = x, cy = y; const a = i / 7 * Math.PI * 2;
          for (let j = 0; j < 4; j++) { cx += Math.cos(a + rnd() - 0.5) * 34; cy += Math.sin(a + rnd() - 0.5) * 12; g.lineTo(cx, cy); }
          g.stroke();
        }
        g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffb45a'; g.globalAlpha = k * 0.6; g.lineWidth = 1; g.stroke();
        break;
      }
      case 'plank':
        g.globalAlpha = Math.min(1, k * 2); g.translate(x, y); g.rotate(p.rot); g.scale(1.3, 1.3);
        { const f = frameOf('items', p.f); if (f) g.drawImage(IMG.items, f[0], f[1], f[2], f[3], -f[2] / 2, -f[3] / 2, f[2], f[3]); }
        break;
      case 'column': {
        g.globalCompositeOperation = 'lighter';
        const w = 40 + (1 - k) * 60;
        const grd = g.createLinearGradient(x - w, 0, x + w, 0);
        grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, p.c); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = Math.sin(k * Math.PI) * 0.9; g.fillStyle = grd; g.fillRect(x - w, 0, w * 2, y + 10);
        g.fillStyle = '#fff'; g.globalAlpha = Math.sin(k * Math.PI) * 0.8; g.fillRect(x - 6, 0, 12, y);
        for (let i = 0; i < 6; i++) { const a = (1 - k) * 8 + i; g.fillStyle = p.c; g.beginPath(); g.arc(x + Math.cos(a) * 50, y - 20 - i * 26 - (1 - k) * 60, 5, 0, 7); g.fill(); }
        break;
      }
      case 'txt':
        g.globalAlpha = Math.min(1, k * 2.5); txt(p.s, x, y, p.size, p.c, 'center', 900); break;
    }
    g.restore();
  }
}

/* ---------- stage drawing ---------- */
function drawStageBackdrop(bg, cam) {
  const img = IMG[bg];
  if (!img) return;
  // far layer (above the horizon) scrolls slower: parallax depth
  g.save(); g.beginPath(); g.rect(0, 0, W, HORIZON); g.clip();
  drawBackdrop(bg, cam * 0.62);
  g.restore();
  g.save(); g.beginPath(); g.rect(0, HORIZON, W, H - HORIZON); g.clip();
  drawBackdrop(bg, cam);
  g.restore();
  // horizon blend line
  const grd = g.createLinearGradient(0, HORIZON - 6, 0, HORIZON + 10);
  grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, 'rgba(5,10,20,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, HORIZON - 6, W, 16);
}

function drawShadow(x, y, r, z = 0) {
  const k = clamp(1 - z / 400, 0.4, 1);
  g.fillStyle = `rgba(2,6,14,${0.42 * k})`;
  g.beginPath(); g.ellipse(x, y + 2, r * k, r * 0.28 * k, 0, 0, 7); g.fill();
}

function drawWeaponOn(o, x, y) {
  const fw = frameOf('items', o.wp);
  const fr = frameOf('fighters', o.f);
  if (!fw || !fr) return;
  const sc = o.sc;
  g.save();
  g.translate(x, y);
  g.scale(o.fc, 1);
  let hx, hy, rot;
  if (o.wa) { hx = (fr[2] - fr[4]) * sc - 18; hy = -fr[5] * sc * 0.64; rot = -0.08; }
  else { hx = 22 * sc; hy = -fr[5] * sc * 0.47; rot = -1.05; }
  g.translate(hx, hy); g.rotate(rot);
  const k = 1.15;
  g.drawImage(IMG.items, fw[0], fw[1], fw[2], fw[3], -8, -fw[3] * k / 2, fw[2] * k, fw[3] * k);
  g.restore();
}

function drawDrawable(o, cam, t) {
  const x = o.x - cam, y = o.y, z = o.z || 0;
  if (o.sh2) { // projectiles
    g.save();
    if (o.sh2 === 'orb') {
      drawShadow(x, y, 16, z);
      g.globalCompositeOperation = 'lighter';
      const r = 16 + Math.sin(t * 20) * 3;
      g.fillStyle = o.c || '#c07bff'; g.globalAlpha = 0.5; g.beginPath(); g.arc(x, y - z, r * 1.8, 0, 7); g.fill();
      g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - z, r * 0.6, 0, 7); g.fill();
    } else if (o.sh2 === 'wave') {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = '#d24a5a'; g.globalAlpha = 0.8;
      g.beginPath(); g.ellipse(x, y - 40, 22, 60, 0, 0, 7); g.fill();
      g.fillStyle = '#ffd0d8'; g.beginPath(); g.ellipse(x + o.fc * 6, y - 40, 8, 50, 0, 0, 7); g.fill();
    } else if (o.sh2 === 'wing') {
      g.globalCompositeOperation = 'lighter';
      g.translate(x, y - z); g.scale(o.fc, 1);
      g.fillStyle = '#ff78bb'; g.globalAlpha = 0.75;
      g.beginPath(); g.moveTo(-40, -90); g.quadraticCurveTo(70, 0, -40, 90); g.quadraticCurveTo(20, 0, -40, -90); g.fill();
      g.fillStyle = '#fff'; g.globalAlpha = 0.9;
      g.beginPath(); g.moveTo(-20, -60); g.quadraticCurveTo(50, 0, -20, 60); g.quadraticCurveTo(15, 0, -20, -60); g.fill();
    }
    g.restore();
    return;
  }
  if (o.tg) { // boss target telegraph
    g.save(); g.strokeStyle = '#ffb657'; g.lineWidth = 3; g.setLineDash([9, 6]); g.lineDashOffset = -t * 40;
    g.globalAlpha = 0.6 + Math.sin(t * 20) * 0.3;
    g.beginPath(); g.ellipse(o.tg[0] - cam, o.tg[1], o.tg[2], o.tg[2] * 0.3, 0, 0, 7); g.stroke();
    g.fillStyle = 'rgba(255,120,40,.16)'; g.fill(); g.restore();
  }
  if (o.bl) {
    g.save(); g.strokeStyle = '#c07bff'; g.globalAlpha = 0.4 + Math.sin(t * 30) * 0.3; g.lineWidth = 2; g.setLineDash([12, 8]);
    g.beginPath(); g.moveTo(x, y - 105); g.lineTo(x + o.fc * 900, y - 105); g.stroke(); g.restore();
  }
  if (o.sh) drawShadow(x, y, o.sh * (o.sc > 1 ? o.sc * 0.8 : 1), z);
  if (o.au) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(x, y - 70 - z, 10, x, y - 70 - z, 120);
    grd.addColorStop(0, o.au); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.55 + Math.sin(t * 30) * 0.15; g.fillStyle = grd; g.fillRect(x - 130, y - 200 - z, 260, 260); g.restore();
  }
  if (o.gh) for (let i = 2; i >= 1; i--) spr(o.s, o.f, x - o.fc * i * 22, y - z, { scale: o.sc, face: o.fc, alpha: 0.18 * (3 - i), rot: o.r });
  const opt = { scale: o.sc, face: o.fc, rot: o.r, alpha: o.a !== undefined ? o.a : 1 };
  if (o.ti) opt.img = tinted(o.s, o.f, o.ti, 'source-atop', 0.62);
  if (o.fl) opt.flash = 0.42;
  // lying bodies: shift so the body rests on the floor line
  let ox = 0;
  if (o.r && Math.abs(o.r) > 1) ox = o.fc * 10;
  if (o.dim) opt.alpha *= 1;
  spr(o.s, o.f, x + ox, y - z, opt);
  if (o.wp) drawWeaponOn(o, x, y - z);
  if (o.gd) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + Math.sin(t * 16) * 0.15; g.fillStyle = '#bfe6ff';
    g.beginPath(); g.ellipse(x + o.fc * 55, y - 120, 18, 90, 0, 0, 7); g.fill(); g.restore();
  }
  if (o.wn) txt('!', x, y - 175 * (o.sc || 1) - z, 30, '#ff7a6a', 'center', 900);
  if (o.hb !== undefined) bar(x - 26, y - 160 * (o.sc / 0.86) - z, 52, 4, o.hb, '#b39cff');
  if (o.pl && Game.showTags) txt(o.pl + 'P', x, y - (o.s === 'people' ? 150 : 160) - z, 15, o.pc || '#fff', 'center', 900);
}

function renderStage(v) {
  const t = v.t;
  const cam = v.cam;
  g.save();
  if (FX.shake) g.translate(rand(-1, 1) * FX.shake, rand(-1, 1) * FX.shake);
  drawStageBackdrop(v.bg, cam);
  const list = v.d.slice().sort((a, b) => (a.y - b.y) || ((a.z || 0) - (b.z || 0)));
  for (const o of list) drawDrawable(o, cam, t);
  drawParts(cam);
  g.restore();
  drawHUD(v.hud, t);
  drawTeamPose();
  if (FX.flash) { g.globalAlpha = Math.min(0.9, FX.flash); g.fillStyle = FX.flashC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
}

/* ---------- HUD ---------- */
function drawPortrait(hero, x, y, s = 0.52, dim = false) {
  const key = HEROES[hero].id + '_0';
  const f = frameOf('fighters', key);
  g.save();
  g.beginPath(); g.rect(x - 34, y - 34, 68, 68); g.clip();
  g.fillStyle = dim ? '#1a1f28' : '#0b1824'; g.fillRect(x - 34, y - 34, 68, 68);
  const grd = g.createRadialGradient(x, y, 4, x, y, 44);
  grd.addColorStop(0, HEROES[hero].color + '88'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(x - 34, y - 34, 68, 68);
  if (f) spr('fighters', key, x - 4, y - 30 + f[5] * s * 1.25, { scale: s * 1.25, alpha: dim ? 0.35 : 1 });
  g.restore();
  g.strokeStyle = HEROES[hero].color; g.lineWidth = 2; g.strokeRect(x - 34, y - 34, 68, 68);
}

function drawHUD(h, t) {
  const n = h.p.length;
  const pw = n <= 2 ? 360 : 300;
  h.p.forEach((p, i) => {
    const hero = HEROES[p.h];
    const x = n <= 2 ? (i === 0 ? 20 : W - pw - 20) : 16 + i * (pw + 12);
    const y = 16;
    g.fillStyle = 'rgba(4,10,20,.78)'; g.fillRect(x, y, pw, 92);
    g.fillStyle = hero.color; g.fillRect(x, y, 4, 92);
    drawPortrait(p.h, x + 46, y + 46, 0.52, !!p.out);
    txt(`${i + 1}P ${hero.name}`, x + 88, y + 24, 17, hero.color, 'left', 900);
    txt(String(p.sc).padStart(7, '0'), x + pw - 12, y + 24, 16, '#f3c27a', 'right', 800);
    if (p.out) {
      txt(Math.floor(t * 2) % 2 ? 'PREMI PUGNO PER CONTINUARE' : '', x + 88, y + 58, 13, '#ffe3a0', 'left', 800);
      return;
    }
    bar(x + 88, y + 36, pw - 104, 14, p.hp / p.mx, p.hp / p.mx < 0.3 ? '#ff6b5a' : '#6fe0a8');
    bar(x + 88, y + 58, pw - 150, 7, p.en / 100, p.en >= 40 ? '#69c0ff' : '#3d6f9a');
    for (let k = 0; k < Math.min(5, p.lv); k++) { g.fillStyle = hero.color; g.beginPath(); g.arc(x + pw - 52 + k * 11, y + 62, 4, 0, 7); g.fill(); }
    if (p.wp) {
      const f = frameOf('items', p.wp);
      if (f) g.drawImage(IMG.items, f[0], f[1], f[2], f[3], x + 88, y + 70, f[2] * 0.7, f[3] * 0.7);
      txt('×' + p.wu, x + 88 + f[2] * 0.7 + 8, y + 84, 12, '#dfe8f0', 'left', 800);
    }
    if (p.cb > 1) txt(`${p.cb} COLPI`, x + pw - 12, y + 86, 14, '#fff1c6', 'right', 900);
  });
  // team meter
  const tx = W / 2 - 170, ty = H - 40;
  g.fillStyle = 'rgba(4,10,20,.7)'; g.fillRect(tx - 10, ty - 22, 360, 38);
  const full = h.team >= 100;
  txt(full ? 'COLPO DI SQUADRA PRONTO!' : 'BARRA SQUADRA', W / 2, ty - 6, 12, full ? (Math.floor(t * 6) % 2 ? '#fff' : '#ffd35a') : '#b8c8d7', 'center', 900);
  const grd = g.createLinearGradient(tx, 0, tx + 340, 0);
  HEROES.forEach((hh, i) => grd.addColorStop(i / 4, hh.color));
  bar(tx, ty, 340, 8, h.team / 100, full ? grd : '#8f7cff');
  // boss
  if (h.boss) {
    const bx = W / 2 - 260, by = H - 112;
    g.fillStyle = 'rgba(20,4,10,.75)'; g.fillRect(bx - 12, by - 8, 544, 58);
    txt(h.boss.n, bx, by + 14, 20, '#ffbe75', 'left', 900);
    txt(h.boss.t, bx + 520, by + 14, 12, '#e8a0a0', 'right', 800);
    bar(bx, by + 26, 520, 12, h.boss.hp / h.boss.mx, '#ef6a4a', '#3a0f14');
    if (h.boss.g) txt('IN GUARDIA · COLPISCI ALLE SPALLE', W / 2, by - 16, 14, '#bfe6ff', 'center', 900);
  }
  if (h.ban && h.ban.k > 0) {
    const a = clamp(Math.min(h.ban.k * 3, (h.ban.e || 0) * 4), 0, 1);
    g.globalAlpha = a;
    g.fillStyle = h.ban.b ? 'rgba(40,6,12,.85)' : 'rgba(4,14,26,.82)';
    g.fillRect(0, 250, W, h.ban.s ? 108 : 78);
    g.fillStyle = h.ban.b ? '#ff6a4a' : '#ffcf7a'; g.fillRect(0, 250, W, 3); g.fillRect(0, 250 + (h.ban.s ? 105 : 75), W, 3);
    txt(h.ban.t, W / 2, 302, 40, h.ban.b ? '#ffd0b0' : '#f5dcad', 'center', 900);
    if (h.ban.s) txt(h.ban.s, W / 2, 338, 18, '#e8eef4', 'center', 800);
    g.globalAlpha = 1;
  }
  if (h.go && Math.floor(t * 3) % 2) {
    txt('AVANTI', W - 150, 380, 30, '#ffe0a0', 'center', 900);
    g.fillStyle = '#ffe0a0'; g.beginPath(); g.moveTo(W - 90, 350); g.lineTo(W - 50, 370); g.lineTo(W - 90, 390); g.fill();
  }
}

function drawTeamPose() {
  if (!FX.team) return;
  const k = FX.team.t;
  const a = clamp(Math.min(k * 4, (1.6 - k) * 4), 0, 1);
  g.save();
  g.globalAlpha = a * 0.75; g.fillStyle = '#05070c'; g.fillRect(0, 0, W, H);
  g.globalAlpha = a;
  const hs = FX.team.heroes.length ? FX.team.heroes : [0];
  const all = hs.length === 1 ? [hs[0]] : hs;
  // coloured rays behind the heroes (tokusatsu explosion)
  g.globalCompositeOperation = 'lighter';
  all.forEach((hid, i) => {
    const cx = W / 2 + (i - (all.length - 1) / 2) * 190;
    g.fillStyle = HEROES[hid].color; g.globalAlpha = a * 0.5;
    g.beginPath(); g.moveTo(cx, 560);
    for (let j = 0; j <= 10; j++) { const ang = -Math.PI + j / 10 * Math.PI; g.lineTo(cx + Math.cos(ang) * (500 + k * 300), 560 + Math.sin(ang) * (500 + k * 200)); }
    g.fill();
  });
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
  all.forEach((hid, i) => {
    const cx = W / 2 + (i - (all.length - 1) / 2) * 190;
    spr('fighters', HEROES[hid].id + (k < 0.4 ? '_0' : '_4'), cx, 600, { scale: 1.45, face: i < all.length / 2 ? 1 : -1 });
  });
  txt('PRIMAL SENTINELS!', W / 2, 150, 58, '#fff4d0', 'center', 900);
  txt('COLPO DI SQUADRA', W / 2, 190, 20, '#ffd35a', 'center', 900);
  g.restore();
}

/* ---------- giant duel drawing ---------- */
function renderGiant(v) {
  const t = v.t;
  g.save();
  if (FX.shake) g.translate(rand(-1, 1) * FX.shake, rand(-1, 1) * FX.shake);
  // background pushed back: zoomed out and darker, with the sky tinted
  drawBackdrop(v.bg, 300 + Math.sin(t * 0.1) * 40);
  g.fillStyle = v.pl.fz ? 'rgba(40,10,60,.35)' : 'rgba(6,10,30,.35)'; g.fillRect(0, 0, W, H);
  // ground dust line
  const P = v.pl, E = v.en;
  drawShadow(P.x, 690, 260); drawShadow(E.x, 690, 230);
  // enemy
  if (E.wn) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + Math.sin(t * 25) * 0.25;
    g.fillStyle = E.wn === 'beam' ? '#c07bff' : '#ff6a4a';
    g.beginPath(); g.arc(E.x - 60, 380, 120, 0, 7); g.fill(); g.restore();
    txt(E.wn === 'beam' ? 'RAGGIO! PARA!' : E.wn === 'charge' ? 'CARICA! PARA O SPOSTATI!' : E.wn === 'stomp' ? 'ONDA SISMICA! PARA!' : E.wn === 'rain' ? 'PIOGGIA DEL VELO! PARA!' : 'ATTACCO!', E.x - 60, 150, 20, '#ffd0c0', 'center', 900);
  }
  spr('bosses', E.f, E.x, E.y, { scale: E.sc, face: -1, flash: E.fl ? 0.7 : 0, alpha: E.a });
  if (E.st) { g.save(); g.globalAlpha = 0.5 + Math.sin(t * 20) * 0.4; txt('✦ ✦ ✦', E.x, 170, 36, '#fff1a6', 'center', 900); g.restore(); }
  // titan
  const T = TITAN_KINDS[P.k];
  if (P.gl || P.fz) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(P.x, 420, 20, P.x, 420, 340);
    grd.addColorStop(0, P.fz ? '#ffe6a0' : T.color); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = (P.gl ? 0.6 : 0.28) + Math.sin(t * 12) * 0.1; g.fillStyle = grd; g.fillRect(P.x - 360, 60, 720, 700); g.restore();
  }
  spr('titans', T.key, P.x, P.y, { scale: T.scale, face: 1, rot: P.r, sx: P.sx, flash: P.fl ? 0.6 : 0 });
  if (P.gd) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4 + Math.sin(t * 14) * 0.15;
    g.strokeStyle = '#bfe6ff'; g.lineWidth = 8; g.beginPath(); g.ellipse(P.x + 200, 400, 60, 250, 0, -1.3, 1.3); g.stroke(); g.restore();
  }
  if (P.fin) {
    const k = P.fin;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = Math.min(1, k * 2); g.fillStyle = '#fff';
    g.beginPath(); g.arc(P.x + 60, 330, 30 + k * 40, 0, 7); g.fill(); g.restore();
    if (k < 0.9) txt(T.fin, W / 2, 130, 40, '#fff4d0', 'center', 900);
  }
  // shockwave & rain
  if (v.sh) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ff9a5a'; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(v.sh, 680, 70, 40, 0, Math.PI, 0); g.fill(); g.restore(); }
  for (const [x, y] of v.rn) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#c07bff'; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.restore(); }
  drawParts(0);
  g.restore();
  drawGiantHUD(v.hud, t);
  if (FX.flash) { g.globalAlpha = Math.min(0.9, FX.flash); g.fillStyle = FX.flashC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
}

function drawGiantHUD(h, t) {
  g.fillStyle = 'rgba(4,10,20,.8)'; g.fillRect(16, 16, 520, 96); g.fillRect(W - 536, 16, 520, 96);
  txt(h.tn, 30, 44, 22, '#ffd35a', 'left', 900);
  bar(30, 56, 490, 16, h.thp / h.tmx, '#6fe0a8');
  txt('ENERGIA', 30, 96, 12, '#9fc8ea', 'left', 800);
  bar(100, 86, 200, 8, h.ten / 100, h.ten >= 50 ? '#69c0ff' : '#3d6f9a');
  // pilots
  h.p.forEach((p, i) => {
    const x = 340 + i * 46;
    g.globalAlpha = p.act ? 1 : 0.55;
    drawPortrait(p.h, x + 17, 92, 0.3);
    g.globalAlpha = 1;
  });
  txt(h.en, W - 30, 44, 22, '#ffbe75', 'right', 900);
  bar(W - 520, 56, 490, 16, h.ehp / h.emx, '#ef6a4a', '#3a0f14');
  txt('EQUILIBRIO', W - 520, 96, 12, '#f0c0a0', 'left', 800);
  bar(W - 430, 86, 250, 8, h.bal / 100, h.stg ? '#fff1a6' : '#f0a05a', '#2a1a10');
  g.fillStyle = 'rgba(4,10,20,.72)'; g.fillRect(W / 2 - 430, H - 44, 860, 30);
  txt(`PUGNO: ${h.moves[0]}  ·  CALCIO: ${h.moves[1]}  ·  SCHIVATA (TIENI): PARATA  ·  SALTO: PASSO  ·  SPECIALE: ${h.stg ? h.moves[2] : 'COLPO TITANICO (50)'}`, W / 2, H - 24, 13, h.stg && Math.floor(t * 6) % 2 ? '#fff1a6' : '#c8d6e4', 'center', 800);
  if (h.ban && h.ban.k > 0) {
    const a = clamp(Math.min(h.ban.k * 3, (h.ban.e || 0) * 4), 0, 1);
    g.globalAlpha = a;
    g.fillStyle = 'rgba(30,10,40,.85)'; g.fillRect(0, 250, W, 108);
    txt(h.ban.t, W / 2, 302, 44, '#ffe6a0', 'center', 900);
    txt(h.ban.s, W / 2, 340, 20, '#f0d0ff', 'center', 800);
    g.globalAlpha = 1;
  }
}
