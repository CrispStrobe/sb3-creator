// bwgame-web.js — browser host for the bwgame-v1 runtime.
//
// Owns everything the core runtime leaves to adapters: loading costume images,
// a 2D-canvas renderer with a pen layer, HTML audio, keyboard/mouse input, the
// ask prompt, and the 30 fps frame loop. Game logic stays in bwgame.js + game.js.

import { Game, STAGE_W, STAGE_H, FPS } from './bwgame.js';

function loadImage (src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

class CanvasPen {
    constructor (images) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = STAGE_W;
        this.canvas.height = STAGE_H;
        this.ctx = this.canvas.getContext('2d');
        this.images = images;
        this.ops = 0;
    }
    clear () { this.ops++; this.ctx.clearRect(0, 0, STAGE_W, STAGE_H); }
    _style (s) {
        const [r, g, b, a] = s.penRgba();
        this.ctx.strokeStyle = this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        this.ctx.lineWidth = s.pen.size;
        this.ctx.lineCap = 'round';
    }
    dot (s) {
        this.ops++;
        this._style(s);
        this.ctx.beginPath();
        this.ctx.arc((STAGE_W / 2) + s.x, (STAGE_H / 2) - s.y, s.pen.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    line (s, x0, y0, x1, y1) {
        this.ops++;
        this._style(s);
        this.ctx.beginPath();
        this.ctx.moveTo((STAGE_W / 2) + x0, (STAGE_H / 2) - y0);
        this.ctx.lineTo((STAGE_W / 2) + x1, (STAGE_H / 2) - y1);
        this.ctx.stroke();
    }
    stamp (s) { this.ops++; drawSprite(this.ctx, s, this.images); }
}

class HtmlAudio {
    constructor (base) { this.base = base; this.playing = new Set(); }
    play (sound, volume) {
        const a = new Audio(this.base + sound.file);
        a.volume = Math.max(0, Math.min(1, volume / 100));
        this.playing.add(a);
        a.onended = () => this.playing.delete(a);
        a.play().catch(() => this.playing.delete(a));
    }
    stopAll () { for (const a of this.playing) a.pause(); this.playing.clear(); }
}

function drawSprite (ctx, s, images) {
    const c = s.costume;
    const img = c && images.get(c.file);
    if (!img) return;
    const k = s.size / 100;
    ctx.save();
    ctx.translate((STAGE_W / 2) + s.x, (STAGE_H / 2) - s.y);
    if (s.rotationStyle === 'all around') ctx.rotate((s.direction - 90) * Math.PI / 180);
    else if (s.rotationStyle === 'left-right' && s.direction < 0) ctx.scale(-1, 1);
    const ghost = Math.max(0, Math.min(100, s.effects.ghost || 0));
    ctx.globalAlpha = 1 - (ghost / 100);
    const bright = Math.max(-100, Math.min(100, s.effects.brightness || 0));
    if (bright) ctx.filter = `brightness(${1 + (bright / 100)})`;
    ctx.drawImage(img, -c.cx * k, -c.cy * k, c.width * k, c.height * k);
    ctx.restore();
}

function roundRect (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function wrapText (ctx, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
        const t = line ? `${line} ${w}` : w;
        if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines.slice(0, 6);
}

function drawBubble (ctx, s) {
    const b = s.bounds();
    ctx.save();
    ctx.font = '14px Helvetica, Arial, sans-serif';
    const lines = wrapText(ctx, s.bubble.text, 150);
    const w = Math.max(40, ...lines.map(l => ctx.measureText(l).width)) + 16;
    const h = (lines.length * 17) + 12;
    let x = (STAGE_W / 2) + b.right, y = (STAGE_H / 2) - b.top - h - 8;
    x = Math.max(2, Math.min(STAGE_W - w - 2, x));
    y = Math.max(2, y);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, s.bubble.kind === 'think' ? 16 : 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#575e75';
    lines.forEach((l, i) => ctx.fillText(l, x + 8, y + 20 + (i * 17)));
    ctx.restore();
}

function drawMonitors (ctx, game) {
    ctx.save();
    ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    for (const m of game.monitors) {
        if (!m.visible || m.kind !== 'var') continue;
        const val = String(game.monitorValue(m));
        const lw = ctx.measureText(m.label).width;
        const vw = Math.max(30, ctx.measureText(val).width + 12);
        const w = lw + vw + 18;
        ctx.fillStyle = '#e6f0ff'; ctx.strokeStyle = '#c4ccd9'; ctx.lineWidth = 1;
        roundRect(ctx, m.x, m.y, w, 22, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#575e75'; ctx.fillText(m.label, m.x + 6, m.y + 15);
        ctx.fillStyle = '#ff8c1a'; roundRect(ctx, m.x + lw + 12, m.y + 3, vw, 16, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(val, m.x + lw + 18, m.y + 15);
    }
    ctx.restore();
}

function drawAsk (ctx, game) {
    const a = game.asking;
    if (!a) return;
    ctx.save();
    ctx.font = '14px Helvetica, Arial, sans-serif';
    const y = STAGE_H - 52;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#c4ccd9'; ctx.lineWidth = 2;
    roundRect(ctx, 8, y, STAGE_W - 16, 44, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#575e75';
    if (a.target.isStage || !a.target.visible) ctx.fillText(a.question, 16, y + 16);
    ctx.fillStyle = '#4c97ff';
    ctx.fillText(`${a.typed || ''}${(Math.floor(Date.now() / 500) % 2) ? '|' : ''}`, 16, y + 36);
    ctx.restore();
}

export function render (ctx, game, images, penCanvas) {
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    const bd = game.stage.costume;
    const bimg = bd && images.get(bd.file);
    if (bimg) ctx.drawImage(bimg, (STAGE_W / 2) - bd.cx, (STAGE_H / 2) - bd.cy, bd.width, bd.height);
    if (penCanvas) ctx.drawImage(penCanvas, 0, 0);
    for (const s of game.layers) if (s.alive && s.visible) drawSprite(ctx, s, images);
    for (const s of game.layers) if (s.alive && s.visible && s.bubble) drawBubble(ctx, s);
    drawMonitors(ctx, game);
    drawAsk(ctx, game);
}

const BLOCKED_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

// start({ canvas, manifest, setup, base, seed, controls: { flag, stop, restart } })
export async function start ({ canvas, manifest, setup, base = './', seed, controls = {} }) {
    const images = new Map();
    const all = [manifest.stage, ...manifest.sprites].flatMap(t => t.costumes);
    await Promise.all(all.map(async c => { images.set(c.file, await loadImage(base + c.file)); }));
    const pen = new CanvasPen(images);
    const game = new Game(manifest, {
        deterministic: false, realtime: true, pen, audio: new HtmlAudio(base),
        seed: seed ?? ((Math.random() * 4294967296) >>> 0),
        onError: (e) => console.error('[bwgame]', e)
    });
    setup(game);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = STAGE_W * dpr;
    canvas.height = STAGE_H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const toStage = (ev) => {
        const r = canvas.getBoundingClientRect();
        return [((ev.clientX - r.left) / r.width * STAGE_W) - (STAGE_W / 2), (STAGE_H / 2) - ((ev.clientY - r.top) / r.height * STAGE_H)];
    };
    window.addEventListener('keydown', (ev) => {
        if (ev.target && /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return;
        if (BLOCKED_KEYS.has(ev.key)) ev.preventDefault();
        game.keyDown(ev.key);
    });
    window.addEventListener('keyup', ev => game.keyUp(ev.key));
    canvas.addEventListener('mousemove', ev => game.mouseMove(...toStage(ev)));
    canvas.addEventListener('mousedown', (ev) => { canvas.focus(); game.mouseDown(...toStage(ev)); });
    window.addEventListener('mouseup', () => game.mouseUp());
    canvas.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; if (t) { ev.preventDefault(); game.mouseDown(...toStage(t)); } }, { passive: false });
    canvas.addEventListener('touchmove', (ev) => { const t = ev.touches[0]; if (t) { ev.preventDefault(); game.mouseMove(...toStage(t)); } }, { passive: false });
    canvas.addEventListener('touchend', () => game.mouseUp());

    if (controls.flag) controls.flag.addEventListener('click', () => { game.greenFlag(); canvas.focus(); });
    if (controls.stop) controls.stop.addEventListener('click', () => game.stopAll());
    if (controls.restart) controls.restart.addEventListener('click', () => { game.restart(); canvas.focus(); });

    let last = performance.now(), acc = 0;
    const frameMs = 1000 / FPS;
    function loop (now) {
        acc += Math.min(250, now - last);
        last = now;
        while (acc >= frameMs) { game.step(); acc -= frameMs; }
        render(ctx, game, images, pen.canvas);
        requestAnimationFrame(loop);
    }
    game.greenFlag();
    requestAnimationFrame(loop);
    canvas.focus();
    return game;
}
