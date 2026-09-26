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
      case 'go': FX.go = 5; Audio.sfx('confirm'); break;
      case 'pop': FX.parts.push({ k: 'pop', x: e.x, y: e.y, s: e.s, c: e.c, big: e.big, life: e.big ? 1.3 : 0.7, max: e.big ? 1.3 : 0.7, rot: rand(-0.25, 0.25), world: !e.fixed && world }); break;
      case 'shock': break;
      case 'uncage': FX.parts.push({ k: 'ring', x: e.x, y: e.y - 70, r: 140, life: 0.5, max: 0.5, c: '#c07bff', world }); for (let i = 0; i < 16; i++) FX.parts.push({ k: 'fire', x: e.x + rand(-50, 50), y: e.y - rand(0, 150), vx: rand(-60, 60), vy: rand(-160, -40), life: 0.6, max: 0.6, c: '#c07bff', s: 6, world }); break;
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
  if (FX.team) { FX.team.t += dt; if (FX.team.t > TEAM_LEN) FX.team = null; }
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
      case 'pop': {
        // comic-book burst with a word
        const age = p.max - p.life;
        const sc = age < 0.12 ? age / 0.12 * 1.25 : 1.25 - Math.min(0.25, (age - 0.12) * 2);
        g.translate(x, y - age * 30); g.rotate(p.rot); g.scale(sc, sc);
        g.globalAlpha = Math.min(1, p.life * 4);
        g.font = `400 ${p.big ? 26 : 18}px ${PXFONT}`;
        const w = g.measureText(p.s).width + 34, h = p.big ? 56 : 42;
        g.fillStyle = '#05070c'; burst(0, 0, w / 2 + 10, h / 2 + 10, 14); g.fill();
        g.fillStyle = p.c; burst(0, 0, w / 2 + 4, h / 2 + 4, 14); g.fill();
        g.fillStyle = '#fff8e0'; burst(0, 0, w / 2 - 4, h / 2 - 4, 14); g.fill();
        ptitle(p.s, 0, (p.big ? 26 : 18) / 2, p.big ? 26 : 18, '#ffffff', p.c);
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

/* personal weapon held in the hand: grip anchor of the weapon on the fist of the frame */
function handPos(key, sc) {
  const fr = frameOf('fighters', key);
  if (!fr) return [20 * sc, -80 * sc];
  const f = +key.split('_')[1];
  if (f === 5) return [(fr[2] - fr[4]) * sc - 14 * sc, -fr[5] * sc * 0.64];
  if (f === 6) return [12 * sc, -fr[5] * sc * 0.62];
  if (f === 4) return [16 * sc, -fr[5] * sc * 0.78];
  return [20 * sc, -fr[5] * sc * 0.52];
}
function drawSigWeapon(key, frameKey, x, y, face, sc, rot, glow, t) {
  if (+frameKey.split('_')[1] >= 8) return;   // weapon already in the sprite
  const fw = frameOf('items', key);
  if (!fw) return;
  const [hx, hy] = handPos(frameKey, sc);
  g.save();
  g.translate(x, y); g.scale(face, 1); g.translate(hx, hy); g.rotate(rot || 0);
  if (glow) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45 + Math.sin(t * 30) * 0.15;
    const grd = g.createLinearGradient(0, 0, fw[2], 0); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, glow);
    g.fillStyle = grd; g.fillRect(-fw[4], -fw[5] - 6, fw[2] + 12, fw[3] + 12); g.restore();
  }
  g.drawImage(IMG.items, fw[0], fw[1], fw[2], fw[3], -fw[4], -fw[5], fw[2], fw[3]);
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
    } else if (o.sh2 === 'bolt') {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = o.c || '#bfe6ff'; g.globalAlpha = 0.55;
      g.fillRect(x - (o.fc > 0 ? 60 : 0), y - z - 6, 60, 12);
      g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.fillRect(x - (o.fc > 0 ? 34 : 0), y - z - 2, 34, 4);
    } else if (o.sh2 === 'flame') {
      g.globalCompositeOperation = 'lighter';
      g.translate(x, y - z); g.scale(o.fc, 1);
      g.fillStyle = '#ff5a1e'; g.globalAlpha = 0.8;
      g.beginPath(); g.moveTo(-30, -110); g.quadraticCurveTo(80, 0, -30, 110); g.quadraticCurveTo(20, 0, -30, -110); g.fill();
      g.fillStyle = '#ffd06a'; g.globalAlpha = 0.9;
      g.beginPath(); g.moveTo(-14, -80); g.quadraticCurveTo(55, 0, -14, 80); g.quadraticCurveTo(14, 0, -14, -80); g.fill();
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
  if (o.fl) { if (o.pl) opt.flash = 0.4; else opt.img = tinted(o.s, o.f, o.ti ? '#ff60ff' : '#ff3a24', 'source-atop', 0.34); }
  // lying bodies: shift so the body rests on the floor line
  let ox = 0;
  if (o.r && Math.abs(o.r) > 1) ox = o.fc * 10;
  if (o.dim) opt.alpha *= 1;
  spr(o.s, o.f, x + ox, y - z, opt);
  if (o.cg) {
    // hostages locked in a cage of Veil energy
    g.save(); g.globalCompositeOperation = 'lighter';
    const fl = 0.55 + Math.sin(t * 13 + o.i) * 0.2;
    g.fillStyle = `rgba(150,70,255,${0.18 * fl})`; g.fillRect(x - 52, y - 150, 104, 152);
    g.fillStyle = `rgba(200,140,255,${0.85 * fl})`;
    for (let bx = -48; bx <= 48; bx += 16) g.fillRect(x + bx, y - 150, 3, 152);
    g.fillRect(x - 52, y - 154, 104, 5); g.fillRect(x - 52, y - 2, 104, 5);
    g.restore();
  }
  if (o.wp) drawWeaponOn(o, x, y - z);
  if (o.sw) drawSigWeapon(o.sw, o.f, x + ox, y - z, o.fc, o.sc, o.sr, o.au || o.pc, t);
  if (o.gd) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + Math.sin(t * 16) * 0.15; g.fillStyle = '#bfe6ff';
    g.beginPath(); g.ellipse(x + o.fc * 55, y - 120, 18, 90, 0, 0, 7); g.fill(); g.restore();
  }
  if (o.wn) txt('!', x, y - 175 * (o.sc || 1) - z, 30, '#ff7a6a', 'center', 900);
  if (o.gb && Math.floor(t * 6) % 2) ptxt('PRESA!', x, y - 168 - z, 9, '#ffe08a', 'center');
  if (o.hb !== undefined) bar(x - 26, y - 160 * (o.sc / 0.86) - z, 52, 4, o.hb, '#b39cff');
  if (o.hint) drawHint(o, x, y - z, t);
  if (o.pl && Game.showTags) txt(o.pl + 'P', x, y - (o.s === 'people' ? 150 : 160) - z, 15, o.pc || '#fff', 'center', 900);
}

/* ---------- chapter 2: fighting on the roof of the moving convoy ---------- */
const TRAIN = { clack: 0, lastT: 0 };
function trainAmount(v) {
  const L = LEVELS[v.lv];
  if (!L || !L.train) return 0;
  return clamp((v.cam - (L.train - 700)) / 220, 0, 1);
}
function drawTrain(cam, t, a, portal) {
  g.save();
  g.globalAlpha = a;
  // landscape rushing past (the far layer of the station art, scrolled fast)
  g.save(); g.beginPath(); g.rect(0, 0, W, HORIZON); g.clip();
  // far layer: only the sky and the industrial skyline of the station art (no parked wagons), tiled
  {
    const img = IMG.rail, sh = 285, dh = 400, sc = dh / sh, tw = img.width * sc;
    const off = cam * 0.35 + t * 620;
    for (let i = Math.floor(off / tw); i * tw - off < W; i++) {
      const x = i * tw - off;
      g.save();
      if (i % 2) { g.translate(x + tw, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, img.width, sh, 0, 0, tw, dh); }
      else g.drawImage(img, 0, 0, img.width, sh, x, 0, tw, dh);
      g.restore();
    }
    const fog = g.createLinearGradient(0, 300, 0, HORIZON);
    fog.addColorStop(0, 'rgba(10,16,34,0)'); fog.addColorStop(1, 'rgba(10,16,34,.9)');
    g.fillStyle = fog; g.fillRect(0, 300, W, HORIZON - 300);
  }
  // mid-distance silhouettes (hills, sheds, trees, pylons) rushing past faster than the far layer
  const hsh = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const midOff = cam * 0.7 + t * 1250, step = 90;
  for (let i = Math.floor(midOff / step) - 1; i * step - midOff < W + step; i++) {
    const x = i * step - midOff, r1 = hsh(i), r2 = hsh(i + 91);
    const hgt = 60 + r1 * 140;
    g.fillStyle = '#0c1222';
    if (r2 < 0.35) { g.beginPath(); g.moveTo(x, HORIZON); g.lineTo(x + step / 2, HORIZON - hgt - 30); g.lineTo(x + step, HORIZON); g.fill(); }          // tree / hill
    else if (r2 < 0.7) { g.fillRect(x + 8, HORIZON - hgt, step - 16, hgt); g.fillStyle = 'rgba(255,190,90,.55)'; if (r1 > 0.4) g.fillRect(x + 20, HORIZON - hgt + 16, 8, 6); }   // shed with a lit window
    else { g.fillRect(x + step / 2 - 3, HORIZON - hgt - 60, 6, hgt + 60); g.fillRect(x + step / 2 - 26, HORIZON - hgt - 56, 52, 5); }   // pylon
  }
  g.fillStyle = '#080c16'; g.fillRect(0, HORIZON - 26, W, 26);
  // motion blur streaks
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const y = 250 + (i * 37) % 210, len = 120 + (i * 53) % 260;
    const x = W - ((t * (900 + (i % 5) * 180) + i * 211) % (W + len + 200));
    g.fillStyle = `rgba(255,${190 - (i % 3) * 40},120,${0.08 + (i % 4) * 0.03})`;
    g.fillRect(x, y, len, 2);
  }
  g.globalCompositeOperation = 'source-over';
  // the Veil portal ahead, getting closer during the boss fight
  if (portal > 0) {
    const r = 40 + portal * 260;
    rift(1060, 180, clamp(portal * 2, 0.35, 1), t);
    glowAt(1060, 180, r * 1.4, '#9a3aff', 0.25 + portal * 0.35);
  }
  g.fillStyle = 'rgba(6,8,20,.25)'; g.fillRect(0, 0, W, HORIZON);
  g.restore();
  // the roof of the wagons (walkable floor), moving with the camera
  const top = HORIZON, h = H - HORIZON;
  const grd = g.createLinearGradient(0, top, 0, H);
  grd.addColorStop(0, '#2a3446'); grd.addColorStop(0.08, '#5a6a80'); grd.addColorStop(0.5, '#46546a'); grd.addColorStop(1, '#2c3646');
  g.fillStyle = grd; g.fillRect(0, top, W, h);
  // longitudinal ribs
  for (let i = 0; i < 7; i++) {
    const y = top + 26 + i * 34 + i * i * 1.5;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, y, W, 3);
    g.fillStyle = 'rgba(190,210,235,.16)'; g.fillRect(0, y - 2, W, 2);
  }
  // transverse panel seams + rivets (perspective: slanted)
  const seam = 96;
  for (let x = -((cam) % seam) - seam; x < W + seam; x += seam) {
    g.strokeStyle = 'rgba(10,14,22,.55)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x + 20, top + 6); g.lineTo(x - 30, H); g.stroke();
    g.fillStyle = 'rgba(210,225,240,.35)';
    for (let k = 0; k < 6; k++) { const yy = top + 20 + k * 42, xx = x + 20 - (yy - top) / h * 50 + 6; g.fillRect(xx, yy, 3, 3); }
  }
  // open gaps between the wagons (same geometry as the simulation: gapLeft/GAP_W)
  for (let wx = Math.floor(cam / WAGON) * WAGON - WAGON; wx < cam + W + WAGON; wx += WAGON) {
    if (!trainOn(LEVELS[1], wx + 60)) continue;
    const x = wx - cam + 40;
    const poly = () => { g.beginPath(); g.moveTo(x, top); g.lineTo(x + GAP_W, top); g.lineTo(x + GAP_W - GAP_SLANT, H); g.lineTo(x - GAP_SLANT, H); g.closePath(); };
    g.save(); poly(); g.clip();
    g.fillStyle = '#0a0806'; g.fillRect(x - 80, top, GAP_W + 120, h);
    // the track rushing below: blurred sleepers and rails
    for (let yy = top + ((t * 1400) % 26); yy < H; yy += 26) { g.fillStyle = 'rgba(110,80,50,.55)'; g.fillRect(x - 80, yy, GAP_W + 120, 8); }
    g.fillStyle = 'rgba(190,200,215,.5)'; g.fillRect(x - 80, top + 60, GAP_W + 120, 3); g.fillRect(x - 80, top + 180, GAP_W + 120, 3);
    // coupling
    g.fillStyle = '#2a2a30'; g.fillRect(x - 60, top + 118, GAP_W + 80, 14);
    g.restore();
    // wagon end walls (depth): dark faces on both sides of the gap
    g.fillStyle = '#1a212c'; g.beginPath(); g.moveTo(x, top); g.lineTo(x + 12, top); g.lineTo(x - GAP_SLANT + 12, H); g.lineTo(x - GAP_SLANT, H); g.fill();
    g.fillStyle = '#39465a'; g.beginPath(); g.moveTo(x + GAP_W - 10, top); g.lineTo(x + GAP_W, top); g.lineTo(x + GAP_W - GAP_SLANT, H); g.lineTo(x + GAP_W - GAP_SLANT - 10, H); g.fill();
    // hazard stripes on the edges
    g.fillStyle = '#e0b020';
    for (let k = 0; k < 8; k++) { const yy = top + k * 32; const off = (yy - top) / h * GAP_SLANT; g.fillRect(x - 14 - off, yy + 4, 12, 14); g.fillRect(x + GAP_W + 2 - off, yy + 4, 12, 14); }
  }
  // roof edge light strip
  g.fillStyle = '#0a0e16'; g.fillRect(0, top - 4, W, 8);
  g.fillStyle = 'rgba(255,190,90,.6)'; for (let x = -((cam * 1) % 60); x < W; x += 60) g.fillRect(x, top - 2, 20, 3);
  g.restore();
  // clack-clack of the rails
  if (a > 0.5 && t - TRAIN.lastT > 0.46) { TRAIN.lastT = t; Audio.noise(0.04, 0.05, 900); Audio.noise(0.04, 0.045, 900, 0.09); }
}
function drawTrainForeground(cam, t, a) {
  // catenary poles whizzing past in the foreground, overhead wires
  g.save(); g.globalAlpha = a;
  g.strokeStyle = 'rgba(20,24,32,.85)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 46 + Math.sin(t * 7) * 2); g.quadraticCurveTo(W / 2, 64, W, 46 + Math.sin(t * 7 + 1) * 2); g.stroke();
  const period = 2.4, k = (t % period) / period;
  const x = W + 200 - k * (W + 800);
  if (x > -200 && x < W + 200) {
    g.fillStyle = 'rgba(8,10,16,.9)';
    g.fillRect(x, 0, 38, H);
    g.fillRect(x - 160, 40, 360, 16);
    g.fillStyle = 'rgba(8,10,16,.35)'; g.fillRect(x + 38, 0, 90, H);   // motion blur
    g.fillStyle = 'rgba(255,200,120,.8)'; g.fillRect(x + 8, 70, 22, 10);
  }
  g.restore();
}

function renderStage(v) {
  const t = v.t;
  const cam = v.cam;
  const tr = trainAmount(v);
  g.save();
  if (FX.shake) g.translate(rand(-1, 1) * FX.shake, rand(-1, 1) * FX.shake);
  if (tr < 1) drawStageBackdrop(v.bg, cam);
  if (tr > 0) { drawTrain(cam, t, tr, v.hud.portal || 0); g.translate(Math.sin(t * 23) * tr * 1.2, Math.abs(Math.sin(t * 11)) * tr * 1.5); }
  const list = v.d.slice().sort((a, b) => (a.y - b.y) || ((a.z || 0) - (b.z || 0)));
  for (const o of list) drawDrawable(o, cam, t);
  drawParts(cam);
  if (tr > 0) drawTrainForeground(cam, t, tr);
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

/* key names for the on-screen hints, depending on the device of each local player */
function keyName(device, action) {
  const kb = { punch: 'J', shoot: 'K', jump: 'SPAZIO', special: 'L', dodge: 'SHIFT', team: 'I' };
  const kbA = { punch: 'F', shoot: 'G', jump: 'SPAZIO', special: 'R', dodge: 'SHIFT', team: 'T' };
  const kbB = { punch: 'K', shoot: 'L', jump: 'I', special: 'O', dodge: 'SHIFT DX', team: 'P' };
  const pad = { punch: 'X', shoot: 'Y', jump: 'A', special: 'B', dodge: 'RB', team: 'LB' };
  if (!device || device === 'remote') return kb[action] + '/' + pad[action];
  if (device.startsWith('pad')) return pad[action];
  if (device === 'kb' || !Game.local.twoKeyboards) return kb[action];
  return (device === 'kbA' ? kbA : kbB)[action];
}
const HUDFX = { trail: [] };
function drawHUD(h, t) {
  const n = h.p.length;
  const pw = n <= 2 ? 380 : 298;
  h.p.forEach((p, i) => {
    const hero = HEROES[p.h];
    const x = n <= 2 ? (i === 0 ? 18 : W - pw - 18) : 14 + i * (pw + 12);
    const y = 14;
    panel(x, y, pw, 92, hero.color);
    drawPortrait(p.h, x + 50, y + 46, 0.52, !!p.out);
    ptxt(`${i + 1}P`, x + 92, y + 24, 12, hero.color);
    ptxt(hero.name, x + 128, y + 24, 12, '#f4f7fa');
    ptxt(String(p.sc).padStart(7, '0'), x + pw - 14, y + 24, 12, '#ffd27a', 'right');
    if (p.out) {
      if (Math.floor(t * 2) % 2) ptxt('PREMI ' + keyName(Game.players[i] && Game.players[i].device, 'punch'), x + 92, y + 62, 10, '#ffe3a0');
      ptxt('PER CONTINUARE', x + 92, y + 80, 9, '#9fb4c8');
      return;
    }
    const v = p.hp / p.mx;
    const tr = HUDFX.trail[i] = Math.max(v, (HUDFX.trail[i] ?? v) - 0.004);
    segBar(x + 92, y + 36, pw - 108, 16, v, tr, v < 0.3 ? (Math.floor(t * 6) % 2 ? '#ff6b5a' : '#ffb35a') : '#58e0a0', 14);
    // energy: marks show how many specials are ready
    segBar(x + 92, y + 62, pw - 170, 8, p.en / 100, 0, p.en >= 40 ? '#5fc2ff' : '#3d6f9a', 5);
    for (let k = 0; k < Math.min(5, p.lv); k++) {
      const lx = x + pw - 64 + k * 13, ly = y + 66;
      g.fillStyle = '#05070c'; g.fillRect(lx - 5, ly - 5, 11, 11);
      g.fillStyle = hero.color; g.fillRect(lx - 4, ly - 4, 9, 9);
      g.fillStyle = '#05070c'; g.fillRect(lx - 3, ly - 1, 7, 3);
    }
    {
      // blaster ammo
      const f = frameOf('items', 'w_gun');
      if (f) g.drawImage(IMG.items, f[0], f[1], f[2], f[3], x + 92, y + 74, f[2] * 0.5, f[3] * 0.5);
      ptxt(`×${p.am ?? 0}`, x + 92 + (f ? f[2] * 0.5 + 4 : 0), y + 86, 9, p.am > 0 ? '#bfe6ff' : '#ff8a7a');
    }
    if (p.cb > 1) ptxt(`${p.cb} COLPI!`, x + pw - 14, y + 88, 11, Math.floor(t * 10) % 2 ? '#fff1c6' : '#ffb03a', 'right');
  });
  // team meter
  const full = h.team >= 100;
  const tx = W / 2 - 180, ty = H - 34;
  panel(tx - 14, ty - 26, 388, 44, full ? '#ffd35a' : '#8f7cff', 0.8);
  const grd = g.createLinearGradient(tx, 0, tx + 360, 0);
  HEROES.forEach((hh, i) => grd.addColorStop(i / 4, hh.color));
  if (full) drawTeamReady(t);
  if (full) {
    const keys = Game.online === 'client' ? keyName(Game.lastDevice || 'kb', 'team') : [...new Set(Game.players.filter((p) => p.device !== 'gone').map((p) => keyName(p.device, 'team')))].join(' / ') || 'I / LB';
    ptxt(Math.floor(t * 4) % 2 ? `COLPO DI SQUADRA! PREMI ${keys}` : 'COLPO DI SQUADRA PRONTO!', W / 2, ty - 8, 10, Math.floor(t * 4) % 2 ? '#ffffff' : '#ffd35a', 'center');
  } else ptxt('BARRA SQUADRA', W / 2, ty - 8, 9, '#b8c8d7', 'center');
  segBar(tx, ty, 360, 9, h.team / 100, 0, full ? '#ffd35a' : '#9d8cff', 10);
  if (full) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 + Math.sin(t * 10) * 0.3; g.fillStyle = grd; g.fillRect(tx, ty, 360, 9); g.restore(); }
  // boss
  if (h.boss) {
    const bx = W / 2 - 280, by = H - 118;
    panel(bx - 14, by - 10, 588, 60, '#ff5a3a', 0.85);
    ptxt(h.boss.n, bx, by + 12, 14, '#ffbe75');
    ptxt(h.boss.t, bx + 560, by + 12, 8, '#e8a0a0', 'right');
    const bv = h.boss.hp / h.boss.mx;
    HUDFX.boss = Math.max(bv, (HUDFX.boss ?? bv) - 0.003);
    segBar(bx, by + 24, 560, 14, bv, HUDFX.boss, '#ff6a3a', 20);
    if (h.boss.g) ptxt('IN GUARDIA · COLPISCI ALLE SPALLE', W / 2, by - 20, 10, '#bfe6ff', 'center');
  } else HUDFX.boss = undefined;
  if (h.ban && h.ban.k > 0) {
    const a = clamp(Math.min(h.ban.k * 3, (h.ban.e || 0) * 4), 0, 1);
    const slide = (1 - clamp((h.ban.e || 0) * 5, 0, 1)) * W;
    g.save(); g.globalAlpha = a;
    g.fillStyle = h.ban.b ? 'rgba(40,6,12,.88)' : 'rgba(4,14,26,.86)';
    g.fillRect(-slide, 250, W, h.ban.s ? 112 : 84);
    g.fillStyle = h.ban.b ? '#ff6a4a' : '#ffcf7a'; g.fillRect(-slide, 250, W, 4); g.fillRect(slide, 250 + (h.ban.s ? 108 : 80), W, 4);
    ptitle(h.ban.t, W / 2 - slide, 308, h.ban.t.length > 22 ? 22 : 30, h.ban.b ? '#ffe0d0' : '#fff6d6', h.ban.b ? '#ff6a3a' : '#ffb03a');
    if (h.ban.s) ptxt(h.ban.s, W / 2 + slide, 342, 11, '#e8eef4', 'center');
    g.restore();
  }
  if (h.go) drawGoArrow(t);
}

/* COLPO DI SQUADRA: the whole team gathers, the five weapons fly together
   into the Cannone Primordiale and it fires across the screen (2.6 s) */
const TEAM_LEN = 2.6;
function drawTeamPose() {
  if (!FX.team) return;
  const k = FX.team.t;
  const fade = clamp(Math.min(k * 5, (TEAM_LEN - k) * 5), 0, 1);
  const players = FX.team.heroes.length ? FX.team.heroes : [0];
  const order = [...players, ...[0, 1, 2, 3, 4].filter((h) => !players.includes(h))];   // players first, then the others join
  const leader = order[0];
  const slots = [2, 1, 3, 0, 4];            // leader in the middle
  const pos = (i) => [W / 2 + (slots[i] - 2) * 170, 600];
  g.save();
  g.globalAlpha = fade * 0.88; g.fillStyle = '#04060c'; g.fillRect(0, 0, W, H);
  // coloured rays behind (tokusatsu explosion)
  g.globalCompositeOperation = 'lighter';
  order.forEach((hid, i) => {
    const [cx] = pos(i);
    g.fillStyle = HEROES[hid].color; g.globalAlpha = fade * 0.32;
    g.beginPath(); g.moveTo(cx, 620);
    const spread = 0.28;
    g.lineTo(cx + Math.cos(-Math.PI / 2 - spread) * 1200, 620 + Math.sin(-Math.PI / 2 - spread) * 1200);
    g.lineTo(cx + Math.cos(-Math.PI / 2 + spread) * 1200, 620 + Math.sin(-Math.PI / 2 + spread) * 1200);
    g.fill();
  });
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = fade;
  // rangers slide into the line-up
  order.forEach((hid, i) => {
    const [tx, ty] = pos(i);
    const arrive = clamp((k - i * 0.06) / 0.35, 0, 1);
    const x = lerp(i % 2 ? W + 120 : -120, tx, 1 - Math.pow(1 - arrive, 3));
    const f = k < 0.45 ? 1 : k < 1.1 ? 8 : i === 0 ? 11 : 0;
    drawShadow(x, ty, 40);
    spr('fighters', `${HEROES[hid].id}_${f}`, x, ty, { scale: 1.2, face: 1, alpha: i < players.length ? 1 : 0.92 });
    // weapons raised over the heads, then flying to the centre
    const fw = frameOf('items', 'w_' + HEROES[hid].id);
    if (k > 0.45 && k < 1.55) {
      const fly = clamp((k - 1.1) / 0.45, 0, 1);
      const wx = lerp(x + 10, W / 2, fly * fly), wy = lerp(ty - 250, 250, fly * fly);
      g.save(); g.translate(wx, wy); g.rotate(fly * 0.3);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = fade * 0.6; g.fillStyle = HEROES[hid].color;
      g.beginPath(); g.arc(0, 0, 50, 0, 7); g.fill();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = fade;
      g.drawImage(IMG.items, fw[0], fw[1], fw[2], fw[3], -fw[4] * 0.9, -fw[5] * 0.9, fw[2] * 0.9, fw[3] * 0.9);
      g.restore();
    }
  });
  // the cannon forms, the leader aims it
  if (k > 1.5) {
    const fc = frameOf('items', 'w_cannon');
    const [lx, ly] = pos(0);
    const cx = lx + 40, cy = ly - 118;
    const form = clamp((k - 1.5) / 0.15, 0, 1);
    if (k < 1.65) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (1 - form) * fade; g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, 250, 160 * (1 - form) + 40, 0, 7); g.fill(); g.restore(); }
    const sc = 1.1;
    const recoil = k > 2.0 ? Math.sin(Math.min(1, (k - 2.0) * 6) * Math.PI) * 14 : 0;
    g.save(); g.translate(cx - recoil, cy); g.scale(sc, sc);
    g.drawImage(IMG.items, fc[0], fc[1], fc[2], fc[3], -fc[4], -fc[5], fc[2], fc[3]);
    g.restore();
    const mx = cx + (fc[2] - fc[4]) * sc - 4, my = cy + (fc[3] * 0.55 - fc[5]) * sc;
    if (k < 2.0) {
      // charging: five colours spiral into the muzzle
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const a = k * 14 + i * 1.256, r = 90 * (2.0 - k) + 10;
        g.fillStyle = HEROES[i].color; g.globalAlpha = fade;
        g.beginPath(); g.arc(mx + Math.cos(a) * r, my + Math.sin(a) * r, 9, 0, 7); g.fill();
      }
      g.globalAlpha = fade * clamp((k - 1.6) * 2.5, 0, 1); g.fillStyle = '#fff'; g.beginPath(); g.arc(mx, my, 10 + (k - 1.6) * 60, 0, 7); g.fill();
      g.restore();
    } else {
      // FIRE
      const f = clamp(1 - (k - 2.0) / 0.6, 0, 1);
      g.save(); g.globalCompositeOperation = 'lighter';
      const bw = 70 * f + 20;
      HEROES.forEach((h, i) => { g.globalAlpha = fade * 0.55; g.fillStyle = h.color; g.fillRect(mx, my - bw + i * bw * 0.4, W, bw * 0.4); });
      g.globalAlpha = fade; g.fillStyle = '#ffffff'; g.fillRect(mx, my - bw * 0.35, W, bw * 0.7);
      g.beginPath(); g.arc(mx, my, bw * 1.3, 0, 7); g.fill();
      g.restore();
    }
  }
  const title = k < 1.5 ? 'COLPO DI SQUADRA!' : 'CANNONE PRIMORDIALE!';
  ptitle(title, W / 2, 120, k < 1.5 ? 34 : 40, '#fff6d6', k < 1.5 ? '#ffb03a' : '#ff6a3a');
  if (k < 1.5) ptxt('PRIMAL SENTINELS', W / 2, 160, 14, '#9fe8ff', 'center');
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
  panel(16, 14, 530, 100, '#ffd35a'); panel(W - 546, 14, 530, 100, '#ff5a3a');
  ptxt(h.tn, 32, 42, 14, '#ffd35a');
  const tv = h.thp / h.tmx; HUDFX.gt = Math.max(tv, (HUDFX.gt ?? tv) - 0.003);
  segBar(32, 54, 496, 16, tv, HUDFX.gt, '#58e0a0', 16);
  ptxt('ENERGIA', 32, 96, 8, '#9fc8ea');
  segBar(100, 88, 200, 8, h.ten / 100, 0, h.ten >= 50 ? '#5fc2ff' : '#3d6f9a', 2);
  h.p.forEach((p, i) => { g.globalAlpha = p.act ? 1 : 0.5; drawPortrait(p.h, 352 + i * 44, 96, 0.3); g.globalAlpha = 1; });
  ptxt(h.en, W - 32, 42, 14, '#ffbe75', 'right');
  const ev = h.ehp / h.emx; HUDFX.ge = Math.max(ev, (HUDFX.ge ?? ev) - 0.003);
  segBar(W - 528, 54, 496, 16, ev, HUDFX.ge, '#ff6a3a', 16);
  ptxt('EQUILIBRIO', W - 528, 96, 8, '#f0c0a0');
  segBar(W - 430, 88, 250, 8, h.bal / 100, 0, h.stg ? '#fff1a6' : '#f0a05a', 5);
  panel(W / 2 - 470, H - 50, 940, 36, '#6fd8d3', 0.8);
  const k = (a) => keyName(Game.players[0] && Game.players[0].device, a);
  ptxt(`${k('punch')} ${h.moves[0]} · ${k('shoot')} ${h.moves[1]} · TIENI ${k('dodge')} PARATA · ${k('jump')} PASSO · ${k('special')} ${h.stg ? h.moves[2] : 'COLPO TITANICO'}`, W / 2, H - 27, 9, h.stg && Math.floor(t * 6) % 2 ? '#fff1a6' : '#c8d6e4', 'center');
  if (h.ban && h.ban.k > 0) {
    const a = clamp(Math.min(h.ban.k * 3, (h.ban.e || 0) * 4), 0, 1);
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(30,10,40,.88)'; g.fillRect(0, 250, W, 112);
    g.fillStyle = '#ffd35a'; g.fillRect(0, 250, W, 4); g.fillRect(0, 358, W, 4);
    ptitle(h.ban.t, W / 2, 310, 32, '#fff6d6', '#ffb03a');
    ptxt(h.ban.s, W / 2, 344, 12, '#f0d0ff', 'center');
    g.restore();
  }
}

/* ---------- pop UI: themed GO arrow, button icons and prompts ---------- */
function burst(cx, cy, rx, ry, n) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, k = i % 2 ? 0.78 : 1; g.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
  g.closePath();
}
/* the silver V of the armours, turned into a chevron with a coloured Heart */
function vChevron(x, y, s, heart, a) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a;
  g.fillStyle = '#05070c'; g.beginPath(); g.moveTo(-26, -46); g.lineTo(6, -46); g.lineTo(40, 0); g.lineTo(6, 46); g.lineTo(-26, 46); g.lineTo(8, 0); g.closePath(); g.fill();
  const grd = g.createLinearGradient(0, -40, 0, 40); grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.5, '#9fb0c4'); grd.addColorStop(0.51, '#dfe8f2'); grd.addColorStop(1, '#8a9ab0');
  g.fillStyle = grd; g.beginPath(); g.moveTo(-18, -38); g.lineTo(2, -38); g.lineTo(31, 0); g.lineTo(2, 38); g.lineTo(-18, 38); g.lineTo(11, 0); g.closePath(); g.fill();
  g.fillStyle = '#05070c'; g.beginPath(); g.arc(18, 0, 9, 0, 7); g.fill();
  g.fillStyle = heart; g.beginPath(); g.arc(18, 0, 6.5, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.fillRect(15, -3, 3, 3);
  g.restore();
}
function drawGoArrow(t) {
  const x0 = W - 330, y = 360;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const grd = g.createRadialGradient(W - 170, y, 10, W - 170, y, 200); grd.addColorStop(0, 'rgba(255,210,90,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(W - 380, y - 200, 400, 400);
  g.restore();
  HEROES.forEach((h, i) => {
    const ph = (t * 2.2 - i * 0.18) % 1;
    const a = Math.max(0, Math.sin(Math.max(0, ph) * Math.PI));
    vChevron(x0 + i * 52 + ph * 20, y, 1.0 + a * 0.12, h.color, 0.35 + a * 0.65);
  });
  ptitle('AVANTI!', W - 190, y - 70, 24, '#fff6d6', '#ffb03a');
}
/* a keyboard key or a gamepad button, with a press animation */
function btnIcon(x, y, device, action, t, scale = 1) {
  const label = keyName(device, action);
  const pad = device && device.startsWith('pad');
  const press = Math.floor(t * 3) % 2 ? 3 : 0;
  g.save(); g.translate(x, y); g.scale(scale, scale);
  if (pad && ['X', 'Y', 'A', 'B'].includes(label)) {
    const col = { X: '#3f86ff', Y: '#f2c230', A: '#58e0a0', B: '#ff4a3d' }[label];
    g.fillStyle = '#05070c'; g.beginPath(); g.arc(0, 3, 21, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(0, press, 18, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(-5, press - 6, 6, 0, 7); g.fill();
    ptxt(label, 0, press + 7, 14, '#10161e', 'center', false);
  } else {
    g.font = `400 12px ${PXFONT}`;
    const w = Math.max(40, g.measureText(label).width + 20), h = 36;
    g.fillStyle = '#05070c'; g.fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 9);
    g.fillStyle = '#6a7686'; g.fillRect(-w / 2, -h / 2 + 5, w, h);
    g.fillStyle = '#e8eef4'; g.fillRect(-w / 2, -h / 2 + press, w, h - 5);
    g.fillStyle = '#ffffff'; g.fillRect(-w / 2 + 3, -h / 2 + 3 + press, w - 6, 3);
    ptxt(label, 0, 6 + press, 12, '#10161e', 'center', false);
  }
  g.restore();
}
function localDevice(slot) {
  if (Game.online === 'client') return (Net.lobby.find((p) => p.id === Net.myId) || {}).id === slot + 1 ? (Game.lastDevice || 'kb') : null;
  const p = Game.players[slot];
  return p && p.device !== 'remote' && p.device !== 'gone' ? p.device : null;
}
function drawHint(o, x, y, t) {
  const dev = localDevice(o.pl - 1);
  if (!dev) return;
  const top = y - 190;
  const info = { power: ['special', 'SPRIGIONA IL TUO POTERE!', '#ffd35a'], grab: ['punch', 'AFFERRALO!', '#ffe08a'], jump: ['jump', 'SALTA!', '#9fe8ff'], morph: ['special', 'TRASFORMATI!', o.pc] }[o.hint];
  if (!info) return;
  const [act, text, col] = info;
  const bob = Math.sin(t * 6) * 4;
  if (o.hint === 'power') {
    g.save(); g.globalCompositeOperation = 'lighter';
    const grd = g.createRadialGradient(x, y - 80, 10, x, y - 80, 150); grd.addColorStop(0, o.pc + 'aa'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.5 + Math.sin(t * 10) * 0.25; g.fillStyle = grd; g.fillRect(x - 150, y - 230, 300, 300); g.restore();
  }
  ptitle(text, x, top - 26 + bob, o.hint === 'power' ? 16 : 13, '#ffffff', col);
  btnIcon(x, top + bob, dev, act, t, 0.9);
}

function drawTeamReady(t) {
  const y = 176;
  const pulse = 1 + Math.sin(t * 8) * 0.05;
  g.save();
  g.translate(W / 2, y); g.scale(pulse, pulse);
  g.globalCompositeOperation = 'lighter';
  HEROES.forEach((h, i) => { const a = t * 2 + i * 1.256; g.fillStyle = h.color; g.globalAlpha = 0.6; g.beginPath(); g.arc(Math.cos(a) * 190, Math.sin(a) * 26, 10, 0, 7); g.fill(); });
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  ptitle('COLPO DI SQUADRA PRONTO!', 0, -8, 20, '#ffffff', '#ffd35a');
  g.restore();
  const devs = Game.online === 'client' ? [Game.lastDevice || 'kb'] : [...new Set(Game.players.filter((p) => p.device !== 'remote' && p.device !== 'gone').map((p) => p.device))];
  devs.slice(0, 4).forEach((d, i) => btnIcon(W / 2 - (devs.length - 1) * 30 + i * 60, y + 28, d, 'team', t, 0.85));
}
