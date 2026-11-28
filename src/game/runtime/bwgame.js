// bwgame.js — Brickwright game runtime, contract "bwgame-v1" (JavaScript).
//
// Generated game modules (src/game/emitJs.js) call this API. It supplies what the
// generic `scratch.*` shim never had: a cooperative Scratch-style scheduler, sprites
// and clones, costumes, layers, pen, keyboard/mouse input, sounds, monitors and
// ask/answer. It has no dependencies; rendering and audio are adapters, so the same
// game runs in a browser page or headless under Node (tests drive `step()`).
//
// The Python runtime (bwgame.py) implements the same contract. Both use the same
// seeded PRNG, the same deterministic clock option and the same number formatting,
// so an identical input trace yields identical state traces in both languages.
//
// Scheduling model (mirrors scratch-vm, documented approximations in GAME-EXPORT.md):
// - A script is a generator. It runs until it yields. Loops yield after every
//   iteration (except inside run-without-screen-refresh procedures), waits yield
//   until their time has passed.
// - One tick per frame at 30 frames per second. Threads run in start order; a
//   thread started during a tick (broadcast) runs in that same tick.
// - Hats fire for the topmost sprite first, as scratch-vm does.

export const CONTRACT = 'bwgame-v1';
export const STAGE_W = 480;
export const STAGE_H = 360;
export const FPS = 30;

// A yielded WAIT survives run-without-screen-refresh; a bare yield does not.
export const WAIT = Symbol('bwgame.wait');

class StopThread extends Error { constructor () { super('stop'); } }

// ---------------------------------------------------------------- numbers & casts

const JS_NUMBER_RE = /^\s*[+-]?(?:Infinity|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+)\s*$/;

function isWhite (v) { return v === null || (typeof v === 'string' && v.trim().length === 0); }

export function num (v) {
    if (typeof v === 'number') return Number.isNaN(v) ? 0 : v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}
export function str (v) {
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return String(v);
}
export function bool (v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        if (v === '' || v === '0' || v.toLowerCase() === 'false') return false;
        return true;
    }
    return Boolean(v);
}
export function compare (a, b) {
    let n1 = Number(a), n2 = Number(b);
    if (n1 === 0 && isWhite(a)) n1 = NaN; else if (n2 === 0 && isWhite(b)) n2 = NaN;
    if (typeof a === 'boolean') n1 = NaN;
    if (typeof b === 'boolean') n2 = NaN;
    if (Number.isNaN(n1) || Number.isNaN(n2)) {
        const s1 = str(a).toLowerCase(), s2 = str(b).toLowerCase();
        return s1 < s2 ? -1 : (s1 > s2 ? 1 : 0);
    }
    if (n1 === Infinity && n2 === Infinity) return 0;
    if (n1 === -Infinity && n2 === -Infinity) return 0;
    return n1 - n2;
}
export const eq = (a, b) => compare(a, b) === 0;
export const lt = (a, b) => compare(a, b) < 0;
export const gt = (a, b) => compare(a, b) > 0;
export const add = (a, b) => num(a) + num(b);
export const sub = (a, b) => num(a) - num(b);
export const mul = (a, b) => num(a) * num(b);
export const div = (a, b) => num(a) / num(b);
export function mod (a, b) {
    const n = num(a), m = num(b);
    let r = n % m;
    if (r / m < 0) r += m;
    return r;
}
export const round = (a) => Math.round(num(a));
// repeat N: Scratch rounds the count once, before the loop starts.
export const times = (n) => Math.round(num(n));
export const join = (a, b) => str(a) + str(b);
export function letterOf (i, s) {
    s = str(s); const k = num(i) - 1;
    return (k < 0 || k >= s.length) ? '' : s.charAt(k);
}
export const length = (s) => str(s).length;
export const contains = (s, sub) => str(s).toLowerCase().includes(str(sub).toLowerCase());

function radians (d) { return Math.PI * d / 180; }
export function mathop (op, v) {
    const n = num(v);
    switch (String(op).toLowerCase()) {
    case 'abs': return Math.abs(n);
    case 'floor': return Math.floor(n);
    case 'ceiling': return Math.ceil(n);
    case 'sqrt': return Math.sqrt(n);
    case 'sin': return parseFloat(Math.sin(radians(n)).toFixed(10));
    case 'cos': return parseFloat(Math.cos(radians(n)).toFixed(10));
    case 'tan': return tanDeg(n);
    case 'asin': return Math.asin(n) * 180 / Math.PI;
    case 'acos': return Math.acos(n) * 180 / Math.PI;
    case 'atan': return Math.atan(n) * 180 / Math.PI;
    case 'ln': return Math.log(n);
    case 'log': return Math.log(n) / Math.LN10;
    case 'e ^': return Math.exp(n);
    case '10 ^': return Math.pow(10, n);
    default: return 0;
    }
}
function tanDeg (a) {
    a %= 360;
    if (a === -270 || a === 90) return Infinity;
    if (a === -90 || a === 270) return -Infinity;
    return parseFloat(Math.tan(radians(a)).toFixed(10));
}

// mulberry32: tiny, exact in both JS and Python (32-bit integer arithmetic).
export function makeRng (seed) {
    let s = seed >>> 0;
    return function next () {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function wrapClamp (v, min, max) {
    const range = (max - min) + 1;
    return v - (Math.floor((v - min) / range) * range);
}
function limitPrecision (c) {
    const r = Math.round(c);
    return Math.abs(c - r) < 1e-9 ? r : c;
}

// ---------------------------------------------------------------- pen colour (HSV 0..100)

function hsvToRgb (h, s, v) {
    h = (h % 360 + 360) % 360; s = Math.max(0, Math.min(1, s)); v = Math.max(0, Math.min(1, v));
    const i = Math.floor(h / 60), f = (h / 60) - i;
    const p = v * (1 - s), q = v * (1 - (s * f)), t = v * (1 - (s * (1 - f)));
    const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
    return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
}
function rgbToHsv (r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const x = Math.min(r, g, b), v = Math.max(r, g, b);
    let h = 0, s = 0;
    if (x !== v) {
        const f = (r === x) ? g - b : ((g === x) ? b - r : r - g);
        const i = (r === x) ? 3 : ((g === x) ? 5 : 1);
        h = ((i - (f / (v - x))) * 60) % 360;
        s = (v - x) / v;
    }
    return [h, s, v];
}
export function colorToRgb (c) {
    if (typeof c === 'string' && c.startsWith('#')) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
        if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 255];
        const m3 = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(c);
        if (m3) return [parseInt(m3[1] + m3[1], 16), parseInt(m3[2] + m3[2], 16), parseInt(m3[3] + m3[3], 16), 255];
        return [0, 0, 0, 255];
    }
    const n = num(c) >>> 0;
    const a = (n >>> 24) & 0xFF;
    return [(n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF, a > 0 ? a : 255];
}

export function colorMatches (rgb, want) {
    return ((rgb[0] & 0xF8) === (want[0] & 0xF8)) && ((rgb[1] & 0xF8) === (want[1] & 0xF8)) &&
        ((rgb[2] & 0xF0) === (want[2] & 0xF0));
}

// ---------------------------------------------------------------- key names

const KEY_ALIASES = { ' ': 'space', arrowleft: 'left arrow', arrowright: 'right arrow', arrowup: 'up arrow', arrowdown: 'down arrow', enter: 'enter', left: 'left arrow', right: 'right arrow', up: 'up arrow', down: 'down arrow', return: 'enter' };
export function scratchKey (k) {
    const s = String(k);
    const low = s.toLowerCase();
    if (KEY_ALIASES[low]) return KEY_ALIASES[low];
    if (low === 'space' || low.endsWith(' arrow') || low === 'any') return low;
    return s.length === 1 ? low : low;
}

// ---------------------------------------------------------------- targets

class Target {
    constructor (game, def, isStage) {
        this.game = game;
        this.def = def;
        this.name = def.name;
        this.isStage = isStage;
        this.isClone = false;
        this.original = this;
        this.vars = { ...def.variables };
        this.lists = Object.fromEntries(Object.entries(def.lists || {}).map(([k, v]) => [k, [...v]]));
        this.costumes = def.costumes;
        this.costumeIndex = def.currentCostume || 0;
        this.sounds = def.sounds || [];
        this.volume = def.volume ?? 100;
        this.effects = {};
        this.alive = true;
    }
    get costume () { return this.costumes[this.costumeIndex]; }
    costumeNumber () { return this.costumeIndex + 1; }
    costumeName () { return this.costume ? this.costume.name : ''; }
    _setCostume (req) {
        const n = this.costumes.length;
        if (!n) return;
        if (typeof req === 'number') { this.costumeIndex = wrapClamp(Math.round(req) - 1, 0, n - 1); return; }
        const s = str(req);
        const byName = this.costumes.findIndex(c => c.name === s);
        if (byName >= 0) { this.costumeIndex = byName; return; }
        if (s === 'next costume' || s === 'next backdrop') { this.costumeIndex = (this.costumeIndex + 1) % n; return; }
        if (s === 'previous costume' || s === 'previous backdrop') { this.costumeIndex = (this.costumeIndex + n - 1) % n; return; }
        if (s === 'random backdrop') { if (n > 1) { let r; do { r = Math.floor(this.game.random() * n); } while (r === this.costumeIndex); this.costumeIndex = r; } return; }
        if (!isWhite(s) && !Number.isNaN(Number(s))) this.costumeIndex = wrapClamp(Math.round(Number(s)) - 1, 0, n - 1);
    }
    setEffect (name, v) { this.effects[String(name).toLowerCase()] = num(v); }
    changeEffect (name, v) { const k = String(name).toLowerCase(); this.effects[k] = (this.effects[k] || 0) + num(v); }
    clearEffects () { this.effects = {}; }
    setVolume (v) { this.volume = Math.max(0, Math.min(100, num(v))); }
    changeVolume (v) { this.setVolume(this.volume + num(v)); }
    createClone (what) {
        const w = str(what);
        const src = w === '_myself_' ? (this.isStage ? null : this) : this.game.sprite(w);
        if (src) this.game._clone(src);
    }
    // sounds
    _sound (req) {
        if (!this.sounds.length) return null;
        const s = str(req);
        const byName = this.sounds.find(x => x.name === s);
        if (byName) return byName;
        if (!isWhite(s) && !Number.isNaN(Number(s))) return this.sounds[wrapClamp(Math.round(Number(s)) - 1, 0, this.sounds.length - 1)];
        return null;
    }
    startSound (req) { const s = this._sound(req); if (s) this.game.audio.play(s, this.volume); }
    * playSoundUntilDone (req) {
        const s = this._sound(req);
        if (!s) return;
        this.game.audio.play(s, this.volume);
        yield * this.game.wait(s.duration || 0);
    }
}

class Stage extends Target {
    constructor (game, def) { super(game, def, true); }
    backdropNumber () { return this.costumeNumber(); }
    backdropName () { return this.costumeName(); }
    switchBackdrop (req) {
        this._setCostume(typeof req === 'number' ? req : req);
        this.game._fireBackdrop(this.costumeName());
    }
    nextBackdrop () { this.switchBackdrop('next backdrop'); }
    * switchBackdropAndWait (req) {
        this._setCostume(req);
        const threads = this.game._fireBackdrop(this.costumeName());
        yield * this.game.waitThreads(threads);
    }
}

class Sprite extends Target {
    constructor (game, def) {
        super(game, def, false);
        this.x = def.x || 0; this.y = def.y || 0;
        this.direction = def.direction ?? 90;
        this.size = def.size ?? 100;
        this.visible = def.visible !== false;
        this.rotationStyle = def.rotationStyle || 'all around';
        this.draggable = !!def.draggable;
        this.bubble = null; // {kind:'say'|'think', text}
        this._bubbleToken = 0;
        this.pen = { down: false, size: 1, hue: 66.66, saturation: 100, brightness: 100, transparency: 0 };
    }
    // --- geometry
    // whole=false: what the costume draws (manifest bounds; Scratch's silhouette bounds,
    // used for touching, edges and bounce). whole=true: the full costume rectangle, which
    // scratch-render uses to fence a sprite onto the stage (getFastBounds).
    bounds (whole = false) {
        const c = this.costume;
        if (!c) return { left: this.x, right: this.x, top: this.y, bottom: this.y };
        const s = this.size / 100;
        const [bl, bt, br, bb] = (!whole && c.bounds) || [0, 0, c.width, c.height];
        let deg = 0, flip = false;
        if (this.rotationStyle === 'all around') deg = this.direction - 90;
        else if (this.rotationStyle === 'left-right' && this.direction < 0) flip = true;
        const pts = [[bl - c.cx, c.cy - bt], [br - c.cx, c.cy - bt], [br - c.cx, c.cy - bb], [bl - c.cx, c.cy - bb]]
            .map(([px, py]) => [(flip ? -px : px) * s, py * s]);
        const r = radians(-deg), cos = Math.cos(r), sin = Math.sin(r);
        let left = Infinity, right = -Infinity, top = -Infinity, bottom = Infinity;
        for (const [px, py] of pts) {
            const X = this.x + (px * cos) - (py * sin), Y = this.y + (px * sin) + (py * cos);
            left = Math.min(left, X); right = Math.max(right, X); top = Math.max(top, Y); bottom = Math.min(bottom, Y);
        }
        return { left, right, top, bottom };
    }
    _fenced (nx, ny) {
        // scratch-render getFencedPositionOfDrawable: keep a sliver (≤15px) on stage,
        // measured on the full costume rectangle.
        const b = this.bounds(true);
        const dx = nx - this.x, dy = ny - this.y;
        const FW = 15;
        const sx = (STAGE_W / 2) - Math.min(FW, Math.floor((b.right - b.left) / 2));
        if (b.right + dx < -sx) nx = Math.ceil(this.x - (sx + b.right));
        else if (b.left + dx > sx) nx = Math.floor(this.x + (sx - b.left));
        const sy = (STAGE_H / 2) - Math.min(FW, Math.floor((b.top - b.bottom) / 2));
        if (b.top + dy < -sy) ny = Math.ceil(this.y - (sy + b.top));
        else if (b.bottom + dy > sy) ny = Math.floor(this.y + (sy - b.bottom));
        return [nx, ny];
    }
    goTo (x, y) {
        const ox = this.x, oy = this.y;
        [this.x, this.y] = this._fenced(num(x), num(y));
        if (this.pen.down) this.game.pen.line(this, ox, oy, this.x, this.y);
    }
    getX () { return limitPrecision(this.x); }
    getY () { return limitPrecision(this.y); }
    setX (x) { this.goTo(x, this.y); }
    setY (y) { this.goTo(this.x, y); }
    changeX (dx) { this.goTo(this.x + num(dx), this.y); }
    changeY (dy) { this.goTo(this.x, this.y + num(dy)); }
    move (steps) {
        const r = radians(90 - this.direction), n = num(steps);
        this.goTo(this.x + (n * Math.cos(r)), this.y + (n * Math.sin(r)));
    }
    pointInDirection (d) { const n = num(d); if (Number.isFinite(n)) this.direction = wrapClamp(n, -179, 180); }
    turnRight (d) { this.pointInDirection(this.direction + num(d)); }
    turnLeft (d) { this.pointInDirection(this.direction - num(d)); }
    _targetXY (what) {
        const w = str(what);
        if (w === '_mouse_') return [num(this.game.mouse.x), num(this.game.mouse.y)];
        if (w === '_random_') return [Math.round(STAGE_W * (this.game.random() - 0.5)), Math.round(STAGE_H * (this.game.random() - 0.5))];
        const t = this.game.sprite(w);
        return t ? [t.x, t.y] : null;
    }
    goToTarget (what) { const p = this._targetXY(what); if (p) this.goTo(p[0], p[1]); }
    pointTowards (what) {
        const p = this._targetXY(what);
        if (!p) return;
        if (str(what) === '_random_') { this.pointInDirection(Math.round(this.game.random() * 360) - 180); return; }
        const dx = p[0] - this.x, dy = p[1] - this.y;
        this.pointInDirection(90 - (Math.atan2(dy, dx) * 180 / Math.PI));
    }
    distanceTo (what) {
        const p = this._targetXY(what);
        if (!p) return 10000;
        return Math.sqrt(((this.x - p[0]) ** 2) + ((this.y - p[1]) ** 2));
    }
    * glideTo (secs, x, y, again = null) {
        // scratch-vm motion_glidesecstoxy: the first tick only starts the timer.
        const dur = 1000 * num(secs), sx = this.x, sy = this.y, ex = num(x), ey = num(y);
        const t0 = this.game.nowMs();
        if (dur <= 0) { this.goTo(ex, ey); return; }
        yield WAIT;
        for (;;) {
            if (again) again();
            const elapsed = this.game.nowMs() - t0;
            if (elapsed >= dur) { this.goTo(ex, ey); return; }
            const f = elapsed / dur;
            this.goTo(sx + ((ex - sx) * f), sy + ((ey - sy) * f));
            yield WAIT;
        }
    }
    * glideToTarget (secs, what) { const p = this._targetXY(what); if (p) yield * this.glideTo(secs, p[0], p[1]); }
    ifOnEdgeBounce () {
        const b = this.bounds();
        const dists = [['left', Math.max(0, (STAGE_W / 2) + b.left)], ['top', Math.max(0, (STAGE_H / 2) - b.top)],
            ['right', Math.max(0, (STAGE_W / 2) - b.right)], ['bottom', Math.max(0, (STAGE_H / 2) + b.bottom)]];
        let edge = '', min = Infinity;
        for (const [e, d] of dists) if (d < min) { min = d; edge = e; }
        if (min > 0) return;
        const r = radians(90 - this.direction);
        let dx = Math.cos(r), dy = -Math.sin(r);
        if (edge === 'left') dx = Math.max(0.2, Math.abs(dx));
        else if (edge === 'top') dy = Math.max(0.2, Math.abs(dy));
        else if (edge === 'right') dx = 0 - Math.max(0.2, Math.abs(dx));
        else if (edge === 'bottom') dy = 0 - Math.max(0.2, Math.abs(dy));
        this.pointInDirection((Math.atan2(dy, dx) * 180 / Math.PI) + 90);
        // keepInFence: move fully back inside the stage
        const nb = this.bounds();
        let mx = 0, my = 0;
        if (nb.left < -STAGE_W / 2) mx += (-STAGE_W / 2) - nb.left;
        if (nb.right > STAGE_W / 2) mx += (STAGE_W / 2) - nb.right;
        if (nb.top > STAGE_H / 2) my += (STAGE_H / 2) - nb.top;
        if (nb.bottom < -STAGE_H / 2) my += (-STAGE_H / 2) - nb.bottom;
        this.goTo(this.x + mx, this.y + my);
    }
    setRotationStyle (s) { this.rotationStyle = str(s); }
    // --- looks
    switchCostume (req) { this._setCostume(req); }
    nextCostume () { this._setCostume('next costume'); }
    show () { this.visible = true; }
    hide () { this.visible = false; }
    setSize (v) {
        const c = this.costume;
        let s = num(v);
        if (c && c.width > 0 && c.height > 0) {
            const minS = Math.min(1, Math.max(5 / c.width, 5 / c.height));
            const maxS = Math.min(1.5 * STAGE_W / c.width, 1.5 * STAGE_H / c.height);
            s = Math.max(minS, Math.min(maxS, s / 100)) * 100;
        }
        this.size = s;
    }
    changeSize (v) { this.setSize(this.size + num(v)); }
    getSize () { return Math.round(this.size); }
    say (text) { this.bubble = (text === '' || text === null) ? null : { kind: 'say', text: str(text) }; this._bubbleToken++; }
    think (text) { this.bubble = (text === '' || text === null) ? null : { kind: 'think', text: str(text) }; this._bubbleToken++; }
    * sayFor (text, secs) { this.say(text); const tok = this._bubbleToken; yield * this.game.wait(secs); if (tok === this._bubbleToken) this.bubble = null; }
    * thinkFor (text, secs) { this.think(text); const tok = this._bubbleToken; yield * this.game.wait(secs); if (tok === this._bubbleToken) this.bubble = null; }
    goToFront () { this.game._layer(this, 'front'); }
    goToBack () { this.game._layer(this, 'back'); }
    goForward (n) { this.game._layer(this, 'forward', num(n)); }
    goBackward (n) { this.game._layer(this, 'backward', num(n)); }
    // --- pixels (costume rasters; see src/game/raster.js)
    // The costume raster for the current costume, or null (box geometry is used then).
    _raster () { const c = this.costume; return c && c.raster ? this.game.raster(c.raster) : null; }
    // scratch-render's sampling, so pixel tests agree with real Scratch:
    // the costume quad maps a stage point to texture coordinates (u, v) in [0, 1], and
    // the silhouette reads texel floor(u * (width - 1)), floor(v * (height - 1)).
    _texel (sx, sy, r) {
        const c = this.costume;
        const s = this.size / 100;
        let deg = 0, flip = false;
        if (this.rotationStyle === 'all around') deg = this.direction - 90;
        else if (this.rotationStyle === 'left-right' && this.direction < 0) flip = true;
        const rad = radians(-deg), cos = Math.cos(rad), sin = Math.sin(rad);
        const dx = sx - this.x, dy = sy - this.y;
        let px = ((dx * cos) + (dy * sin)) / s;
        const py = ((-dx * sin) + (dy * cos)) / s;
        if (flip) px = -px;
        const u = (px + c.cx) / c.width, v = (c.cy - py) / c.height;
        if (u < 0 || v < 0 || u > 1 || v > 1) return null;
        return [u * (r.width - 1), v * (r.height - 1)];
    }
    // Bitmaps always sample the nearest texel; SVGs only at multiples of 90 degrees and
    // ~100% size, otherwise any of the four texels a linear sample would read.
    _nearest () {
        const c = this.costume;
        if (c.format !== 'svg') return true;
        const dir = this.rotationStyle === 'all around' ? this.direction : 90;
        return dir % 90 === 0 && this.size > 99 && this.size < 101;
    }
    _alpha (r, x, y) { return (x < 0 || y < 0 || x >= r.width || y >= r.height) ? 0 : r.rgba[(((y * r.width) + x) * 4) + 3]; }
    // Does this sprite's silhouette cover the stage point (scratch-render isTouching)?
    hits (sx, sy) {
        const r = this._raster();
        if (!r) {
            const b = this.bounds();
            return sx >= b.left && sx <= b.right && sy >= b.bottom && sy <= b.top;
        }
        const t = this._texel(sx, sy, r);
        if (!t) return false;
        const x = Math.floor(t[0]), y = Math.floor(t[1]);
        if (this._nearest()) return this._alpha(r, x, y) > 0;
        return this._alpha(r, x, y) > 0 || this._alpha(r, x + 1, y) > 0 || this._alpha(r, x, y + 1) > 0 || this._alpha(r, x + 1, y + 1) > 0;
    }
    // RGBA (after ghost) of the nearest texel at a stage point, or null where nothing is drawn.
    pixelAt (sx, sy) {
        const r = this._raster();
        if (!r) return this.hits(sx, sy) ? [0, 0, 0, 255] : null;
        const t = this._texel(sx, sy, r);
        if (!t) return null;
        const i = ((Math.floor(t[1]) * r.width) + Math.floor(t[0])) * 4;
        const a = r.rgba[i + 3];
        if (!a) return null;
        const ghost = Math.max(0, Math.min(100, this.effects.ghost || 0));
        return [r.rgba[i], r.rgba[i + 1], r.rgba[i + 2], Math.round(a * (1 - (ghost / 100)))];
    }
    // scratch-render's CPU checks: integer stage points of the box clamped to the stage
    // and snapped outward, x outer, y inner, both inclusive.
    _eachPoint (b, fn) {
        const x0 = Math.floor(Math.max(b.left, -STAGE_W / 2)), x1 = Math.ceil(Math.min(b.right, STAGE_W / 2));
        const y0 = Math.floor(Math.max(b.bottom, -STAGE_H / 2)), y1 = Math.ceil(Math.min(b.top, STAGE_H / 2));
        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) if (fn(x, y)) return true;
        }
        return false;
    }
    // --- sensing
    touching (what) {
        const w = str(what);
        if (!this.visible) return false;
        const b = this.bounds();
        const pixels = !!this._raster();
        if (w === '_mouse_') {
            const m = this.game.mouse;
            if (m.x === undefined) return false;
            if (!pixels) return m.x >= b.left && m.x <= b.right && m.y >= b.bottom && m.y <= b.top;
            return this.hits(Math.floor(m.x), Math.ceil(m.y));
        }
        if (w === '_edge_') return b.left < -STAGE_W / 2 || b.right > STAGE_W / 2 || b.top > STAGE_H / 2 || b.bottom < -STAGE_H / 2;
        for (const o of this.game.spritesNamed(w)) {
            if (o === this || !o.visible || !o.alive) continue;
            const ob = o.bounds();
            if (!(b.left < ob.right && b.right > ob.left && b.bottom < ob.top && b.top > ob.bottom)) continue;
            if (!pixels || !o._raster()) return true;
            const box = { left: Math.max(b.left, ob.left), right: Math.min(b.right, ob.right), bottom: Math.max(b.bottom, ob.bottom), top: Math.min(b.top, ob.top) };
            if (this._eachPoint(box, (x, y) => this.hits(x, y) && o.hits(x, y))) return true;
        }
        return false;
    }
    // Scratch compares the top 5 bits of red and green and the top 4 bits of blue.
    touchingColor (color) {
        if (!this.visible || !this._raster()) return false;
        const want = colorToRgb(color);
        return this._eachPoint(this.bounds(), (x, y) =>
            this.hits(x, y) && colorMatches(this.game.compositeAt(x, y, this), want));
    }
    colorTouchingColor (mine, other) {
        if (!this.visible || !this._raster()) return false;
        const a = colorToRgb(mine), b = colorToRgb(other);
        return this._eachPoint(this.bounds(), (x, y) => {
            const p = this.pixelAt(x, y);
            return p !== null && colorMatches(p, a) && colorMatches(this.game.compositeAt(x, y, this), b);
        });
    }
    // --- pen
    penDown () { this.pen.down = true; this.game.pen.dot(this); }
    penUp () { this.pen.down = false; }
    stamp () { this.game.pen.stamp(this); }
    setPenColor (c) {
        const [r, g, b, a] = colorToRgb(c);
        const [h, s, v] = rgbToHsv(r, g, b);
        Object.assign(this.pen, { hue: h / 3.6, saturation: s * 100, brightness: v * 100, transparency: 100 * (1 - (a / 255)) });
    }
    _penParam (p, v, change) {
        const k = { color: 'hue', saturation: 'saturation', brightness: 'brightness', transparency: 'transparency' }[String(p).toLowerCase()];
        if (!k) return;
        let n = (change ? this.pen[k] : 0) + num(v);
        if (k === 'hue') n = wrapClamp(n, 0, 100); else n = Math.max(0, Math.min(100, n));
        this.pen[k] = n;
    }
    setPenParam (p, v) { this._penParam(p, v, false); }
    changePenParam (p, v) { this._penParam(p, v, true); }
    setPenSize (v) { this.pen.size = Math.max(1, Math.min(1200, num(v))); }
    changePenSize (v) { this.setPenSize(this.pen.size + num(v)); }
    penRgba () {
        const [r, g, b] = hsvToRgb(this.pen.hue * 3.6, this.pen.saturation / 100, this.pen.brightness / 100);
        return [r, g, b, 1 - (this.pen.transparency / 100)];
    }
    // --- clones
    deleteThisClone () {
        if (!this.isClone) return;
        this.game._removeClone(this);
        throw new StopThread();
    }
}

// ---------------------------------------------------------------- pen & audio adapters

class NullPen {
    constructor () { this.ops = 0; }
    clear () { this.ops++; }
    dot () { this.ops++; }
    line () { this.ops++; }
    stamp () { this.ops++; }
}
class NullAudio {
    constructor () { this.played = []; }
    play (sound) { this.played.push(sound.name); }
    stopAll () {}
}

// ---------------------------------------------------------------- game

class Thread {
    constructor (target, script, gen) { this.target = target; this.script = script; this.gen = gen; this.done = false; }
}

export class Game {
    constructor (manifest, opts = {}) {
        this.manifest = manifest;
        this.opts = opts;
        this.contract = CONTRACT;
        this.deterministic = opts.deterministic !== false && opts.realtime !== true;
        this.seed = opts.seed ?? 1;
        this.pen = opts.pen || new NullPen();
        this.audio = opts.audio || new NullAudio();
        this.scripts = [];      // {target name, hat, arg, fn}
        this.procs = {};
        this.onAsk = opts.onAsk || null;
        this._init();
    }
    _init () {
        this.random = makeRng(this.seed);
        this.frame = 0;
        this.timerStartMs = 0;
        this.threads = [];
        this.keys = new Set();
        // scratch-vm leaves the mouse position undefined until the first mouse event:
        // `mouse x` then compares as the string "undefined" and nothing touches the pointer.
        this.mouse = { x: undefined, y: undefined, down: false };
        this.answer = '';
        this.asking = null;
        this.askQueue = [];
        // Reset the stage in place: generated setup() captured `const stage = game.stage`.
        const stage = new Stage(this, this.manifest.stage);
        if (this.stage) { for (const k of Object.keys(this.stage)) delete this.stage[k]; Object.assign(this.stage, stage); } else this.stage = stage;
        this.sprites = this.manifest.sprites.map(d => new Sprite(this, d));
        // drawing order, back to front; manifest lists sprites by layerOrder
        this.layers = [...this.sprites].sort((a, b) => (a.def.layerOrder || 0) - (b.def.layerOrder || 0));
        this.monitors = (this.manifest.monitors || []).map(m => ({ ...m }));
        this.cloneCount = 0;
        this.stopped = false;
        this.pen.clear();
    }
    // --- costume rasters (opts.rasters: { 'assets/raster/x.bwr': {width, height, scale, rgba} })
    raster (file) { return (this.opts.rasters && this.opts.rasters[file]) || null; }
    // The colour Scratch would read at a stage point with `except` hidden: backdrop,
    // pen layer (when the host can sample it) and every other visible sprite, blended.
    compositeAt (x, y, except) {
        let rgb = [255, 255, 255];
        const st = this.stage, bd = st.costume, r = bd && bd.raster ? this.raster(bd.raster) : null;
        if (r) {
            const u = Math.floor((x + bd.cx) * r.scale), v = Math.floor((bd.cy - y) * r.scale);
            if (u >= 0 && v >= 0 && u < r.width && v < r.height) rgb = blend(rgb, r.rgba.subarray(((v * r.width) + u) * 4, ((v * r.width) + u + 1) * 4));
        }
        const pen = this.pen.sample ? this.pen.sample(x, y) : null;
        if (pen) rgb = blend(rgb, pen);
        for (const s of this.layers) {
            if (s === except || !s.alive || !s.visible) continue;
            const p = s.pixelAt(x, y);
            if (p) rgb = blend(rgb, p);
        }
        return rgb;
    }
    // --- registration (called by generated code)
    on (targetName, hat, arg, fn) { this.scripts.push({ target: targetName, hat, arg: arg == null ? null : String(arg), fn }); }
    // --- clock (milliseconds, like scratch-vm; deterministic mode counts frames)
    nowMs () { return this.deterministic ? (this.frame * 1000) / FPS : performance.now(); }
    now () { return this.nowMs() / 1000; }
    timer () { return (this.nowMs() - this.timerStartMs) / 1000; }
    resetTimer () { this.timerStartMs = this.nowMs(); }
    // scratch-vm control_wait: start a timer, yield once, then yield until
    // elapsed >= duration (compared in milliseconds, float error included).
    // again: re-evaluates the block's inputs each frame it runs again (scratch-vm does,
    // which is observable when an input draws pick random).
    * wait (secs, again = null) {
        const start = this.nowMs(), dur = Math.max(0, 1000 * num(secs));
        yield WAIT;
        if (again) again();
        while (this.nowMs() - start < dur) { yield WAIT; if (again) again(); }
    }
    * waitUntil (cond) { while (!bool(cond())) yield WAIT; }
    * warp (gen) {
        let r;
        while (!(r = gen.next()).done) if (r.value === WAIT) yield WAIT;
        return r.value;
    }
    * waitThreads (threads) {
        yield WAIT;
        while (threads.some(t => !t.done)) yield WAIT;
    }
    // --- lookup
    target (name) { return name === '_stage_' || name === this.stage.name ? this.stage : this.sprite(name); }
    sprite (name) { return this.sprites.find(s => s.name === name && !s.isClone && s.alive) || null; }
    spritesNamed (name) { return this.layers.filter(s => s.name === name && s.alive); }
    // --- hats
    _hatTargets (name) {
        // topmost first, then the stage (scratch-vm iterates executableTargets in reverse)
        const list = this.layers.filter(s => s.name === name && s.alive).reverse();
        if (name === this.stage.name || name === '_stage_') return [this.stage];
        return list;
    }
    _start (match, restart, only) {
        const started = [];
        const order = [...this.layers].reverse().concat([this.stage]);
        for (const t of order) {
            if (only && t !== only) continue;
            if (!t.alive) continue;
            for (const sc of this.scripts) {
                if (sc.target !== (t.isStage ? '_stage_' : t.name)) continue;
                if (!match(sc)) continue;
                const existing = this.threads.find(th => th.target === t && th.script === sc && !th.done);
                if (existing) {
                    if (!restart) continue;
                    existing.gen = sc.fn(t);
                    started.push(existing);
                    continue;
                }
                const th = new Thread(t, sc, sc.fn(t));
                this.threads.push(th);
                started.push(th);
            }
        }
        return started;
    }
    greenFlag () {
        this.stopAll();
        this.stopped = false;
        this.resetTimer();
        return this._start(sc => sc.hat === 'flag', true);
    }
    restart () { this._init(); return this.greenFlag(); }
    broadcast (name) {
        const n = str(name).toLowerCase();
        return this._start(sc => sc.hat === 'broadcast' && sc.arg.toLowerCase() === n, true);
    }
    * broadcastAndWait (name) { yield * this.waitThreads(this.broadcast(name)); }
    _fireBackdrop (name) { return this._start(sc => sc.hat === 'backdrop' && sc.arg === name, false); }
    keyDown (key) {
        const k = scratchKey(key);
        this.keys.add(k);
        if (this.asking) { this._askKey(key); return; }
        this._start(sc => sc.hat === 'key' && (sc.arg === k || sc.arg === 'any'), false);
    }
    keyUp (key) { this.keys.delete(scratchKey(key)); }
    keyPressed (key) {
        const k = scratchKey(key);
        if (k === 'any') return this.keys.size > 0;
        return this.keys.has(k);
    }
    mouseMove (x, y) { this.mouse.x = num(x); this.mouse.y = num(y); }
    // scratch-vm Mouse.postData: the topmost sprite whose silhouette covers the integer
    // stage point under the pointer (else the stage) is clicked; draggable sprites fire
    // their click hats on mouse up, others on mouse down.
    _pick () {
        const px = Math.floor(num(this.mouse.x)), py = Math.ceil(num(this.mouse.y));
        for (const s of [...this.layers].reverse()) {
            if (s.alive && s.visible && s.hits(px, py)) return s;
        }
        return this.stage;
    }
    _click (t) { this._start(sc => sc.hat === 'clicked', true, t); }
    mouseDown (x, y) {
        if (x !== undefined) this.mouseMove(x, y);
        if (this.mouse.down) return;
        this.mouse.down = true;
        const t = this._pick();
        if (!t.draggable) this._click(t);
    }
    mouseUp (x, y) {
        if (x !== undefined) this.mouseMove(x, y);
        if (!this.mouse.down) return;
        this.mouse.down = false;
        const t = this._pick();
        if (t.draggable) this._click(t);
    }
    // --- clones and layers
    _clone (src) {
        if (this.cloneCount >= 300) return null;
        const c = new Sprite(this, src.def);
        Object.assign(c, {
            x: src.x, y: src.y, direction: src.direction, size: src.size, visible: src.visible,
            rotationStyle: src.rotationStyle, costumeIndex: src.costumeIndex, volume: src.volume,
            isClone: true, original: src.original
        });
        c.vars = { ...src.vars };
        c.lists = Object.fromEntries(Object.entries(src.lists).map(([k, v]) => [k, [...v]]));
        c.effects = { ...src.effects };
        c.pen = { ...src.pen };
        this.sprites.push(c);
        // a clone sits directly behind its parent
        this.layers.splice(this.layers.indexOf(src), 0, c);
        this.cloneCount++;
        this._start(sc => sc.hat === 'clone', false, c);
        return c;
    }
    _removeClone (c) {
        c.alive = false;
        for (const th of this.threads) if (th.target === c) th.done = true;
        this.sprites = this.sprites.filter(s => s !== c);
        this.layers = this.layers.filter(s => s !== c);
        this.cloneCount--;
    }
    _layer (s, how, n = 1) {
        const i = this.layers.indexOf(s);
        if (i < 0) return;
        this.layers.splice(i, 1);
        let j;
        if (how === 'front') j = this.layers.length;
        else if (how === 'back') j = 0;
        else if (how === 'forward') j = Math.max(0, Math.min(this.layers.length, i + Math.round(n)));
        else j = Math.max(0, Math.min(this.layers.length, i - Math.round(n)));
        this.layers.splice(j, 0, s);
    }
    // --- stopping
    stopAll () {
        for (const th of this.threads) th.done = true;
        this.threads = [];
        for (const s of [...this.sprites]) if (s.isClone) this._removeClone(s);
        for (const s of this.sprites) { s.clearEffects(); s.bubble = null; }
        this.stage.clearEffects();
        this.audio.stopAll();
        this.asking = null; this.askQueue = [];
        this.stopped = true;
    }
    stopAllAndThrow () { this.stopAll(); throw new StopThread(); }
    stopOtherScripts (target) {
        for (const th of this.threads) if (th.target === target && th !== this.current) th.done = true;
    }
    // --- ask / answer
    * ask (target, question) {
        const entry = { target, question: str(question), done: false };
        this.askQueue.push(entry);
        if (!this.asking) this._nextAsk();
        while (!entry.done) yield WAIT;
    }
    _nextAsk () {
        this.asking = this.askQueue[0] || null;
        if (!this.asking) return;
        this.asking.typed = '';
        if (!this.asking.target.isStage && this.asking.target.visible) this.asking.target.say(this.asking.question);
        if (this.onAsk) this.onAsk(this.asking);
    }
    _askKey (key) {
        const a = this.asking;
        if (key === 'Enter' || key === 'enter' || key === 'Return') { this.submitAnswer(a.typed); return; }
        if (key === 'Backspace' || key === 'backspace') { a.typed = a.typed.slice(0, -1); return; }
        if (String(key).length === 1) a.typed += key;
        else if (scratchKey(key) === 'space') a.typed += ' ';
    }
    submitAnswer (text) {
        const a = this.asking;
        if (!a) return;
        this.answer = str(text);
        if (!a.target.isStage) a.target.say('');
        a.done = true;
        this.askQueue.shift();
        this._nextAsk();
    }
    // --- monitors
    showVariable (target, name, show) {
        let m = this.monitors.find(x => x.kind === 'var' && x.target === target && x.name === name);
        if (!m) {
            m = { id: `${target}:${name}`, kind: 'var', target, name, label: target === '_stage_' ? name : `${target}: ${name}`, visible: false, mode: 'default', x: 5, y: 5 + (27 * this.monitors.length) };
            this.monitors.push(m);
        }
        m.visible = !!show;
    }
    monitorValue (m) {
        const t = m.target === '_stage_' ? this.stage : this.sprite(m.target);
        if (!t) return '';
        if (m.kind === 'list') return lists.join(t.lists[m.name] || []);
        const v = t.vars[m.name];
        return v === undefined ? '' : (typeof v === 'number' ? fmtNum(v) : str(v));
    }
    // --- one frame
    step () {
        this.frame++;
        const threads = this.threads;
        for (let i = 0; i < threads.length; i++) {
            const th = threads[i];
            if (th.done) continue;
            this.current = th;
            try {
                const r = th.gen.next();
                if (r.done) th.done = true;
            } catch (e) {
                if (e instanceof StopThread) th.done = true;
                else { th.done = true; if (this.opts.onError) this.opts.onError(e, th); else throw e; }
            }
        }
        this.current = null;
        this.threads = this.threads.filter(t => !t.done);
        if (this.threads.length === 0 && !this.stopped && this.frame > 0) this.idle = true;
    }
    run (frames) { for (let i = 0; i < frames; i++) this.step(); }
    // Drive the game from a scripted input trace (identical in bwgame.py):
    // { frames, sample: [frame...], events: [{ frame, type, key?, x?, y?, text? }] }.
    // Events for frame f are applied before the step that produces frame f + 1.
    // type: flag | keydown | keyup | mousemove | mousedown | mouseup | answer.
    runTrace (trace) {
        const out = [];
        const sample = new Set(trace.sample || []);
        const events = trace.events || [];
        for (let f = 0; f < trace.frames; f++) {
            for (const e of events) {
                if (e.frame !== f) continue;
                if (e.type === 'flag') this.greenFlag();
                else if (e.type === 'keydown') this.keyDown(e.key);
                else if (e.type === 'keyup') this.keyUp(e.key);
                else if (e.type === 'mousemove') this.mouseMove(e.x, e.y);
                else if (e.type === 'mousedown') this.mouseDown(e.x, e.y);
                else if (e.type === 'mouseup') this.mouseUp();
                else if (e.type === 'answer') this.submitAnswer(e.text);
            }
            this.step();
            if (sample.has(f + 1)) out.push(this.snapshot());
        }
        return out;
    }
    // --- state snapshot (identical shape in bwgame.py)
    snapshot () {
        const sprite = s => ({
            name: s.name, clone: s.isClone, x: fmtNum(s.x), y: fmtNum(s.y), direction: fmtNum(s.direction),
            size: fmtNum(s.size), costume: s.costumeIndex + 1, visible: s.visible,
            vars: fmtVars(s.vars), lists: fmtLists(s.lists), bubble: s.bubble ? s.bubble.text : null
        });
        return {
            frame: this.frame,
            backdrop: this.stage.costumeIndex + 1,
            vars: fmtVars(this.stage.vars),
            lists: fmtLists(this.stage.lists),
            layers: this.layers.filter(s => s.alive).map(sprite),
            threads: this.threads.filter(t => !t.done).length,
            answer: this.answer
        };
    }
}

// Source-over blend of an RGBA pixel onto an opaque RGB colour (integer result).
function blend (dst, src) {
    const a = src[3] / 255;
    return [Math.round((src[0] * a) + (dst[0] * (1 - a))), Math.round((src[1] * a) + (dst[1] * (1 - a))),
        Math.round((src[2] * a) + (dst[2] * (1 - a)))];
}

// Round to 6 decimals so JS and Python agree despite last-bit trig differences.
function fmtNum (n) { return typeof n === 'number' ? Math.round(n * 1e6) / 1e6 : n; }
function fmtVal (v) { return typeof v === 'number' ? fmtNum(v) : (typeof v === 'boolean' ? str(v) : v); }
function fmtVars (vars) { return Object.fromEntries(Object.keys(vars).sort().map(k => [k, fmtVal(vars[k])])); }
function fmtLists (lists) { return Object.fromEntries(Object.keys(lists).sort().map(k => [k, lists[k].map(fmtVal)])); }

// ---------------------------------------------------------------- list helpers

export function listIndex (idx, len, rng) {
    if (typeof idx !== 'number') {
        const s = str(idx);
        if (s === 'all') return 'all';
        if (s === 'last') return len > 0 ? len : 0;
        if (s === 'random' || s === 'any') return len > 0 ? 1 + Math.floor(rng() * len) : 0;
    }
    const n = Math.floor(num(idx));
    return (n < 1 || n > len) ? 0 : n;
}
export const lists = {
    add (l, v) { l.push(v); },
    delete (game, l, i) {
        const k = listIndex(i, l.length, game.random);
        if (k === 'all') { l.length = 0; return; }
        if (k) l.splice(k - 1, 1);
    },
    clear (l) { l.length = 0; },
    insert (game, l, i, v) {
        const k = listIndex(i, l.length + 1, game.random);
        if (k && k !== 'all') l.splice(k - 1, 0, v);
    },
    replace (game, l, i, v) {
        const k = listIndex(i, l.length, game.random);
        if (k && k !== 'all') l[k - 1] = v;
    },
    item (game, l, i) {
        const k = listIndex(i, l.length, game.random);
        return (k && k !== 'all') ? l[k - 1] : '';
    },
    indexOf (l, v) { for (let i = 0; i < l.length; i++) if (eq(l[i], v)) return i + 1; return 0; },
    length (l) { return l.length; },
    contains (l, v) { return l.some(x => eq(x, v)); },
    join (l) {
        // Scratch joins with spaces unless every item is a single character
        const allSingle = l.every(x => str(x).length === 1);
        return l.map(str).join(allSingle ? '' : ' ');
    }
};

export function random (game, a, b) {
    const lo = num(a), hi = num(b);
    const low = Math.min(lo, hi), high = Math.max(lo, hi);
    const isInt = v => typeof v === 'number' ? Number.isInteger(v) : !String(v).includes('.');
    if (low === high) return low;
    if (isInt(a) && isInt(b)) return low + Math.floor(game.random() * ((high + 1) - low));
    return (game.random() * (high - low)) + low;
}

export function attributeOf (game, attr, objName) {
    const a = str(attr);
    if (objName === '_stage_') {
        const st = game.stage;
        if (a === 'backdrop #') return st.backdropNumber();
        if (a === 'backdrop name') return st.backdropName();
        if (a === 'volume') return st.volume;
        return Object.prototype.hasOwnProperty.call(st.vars, a) ? st.vars[a] : 0;
    }
    const s = game.sprite(str(objName));
    if (!s) return 0;
    switch (a) {
    case 'x position': return s.getX();
    case 'y position': return s.getY();
    case 'direction': return s.direction;
    case 'costume #': return s.costumeNumber();
    case 'costume name': return s.costumeName();
    case 'size': return s.getSize();
    case 'volume': return s.volume;
    default: return Object.prototype.hasOwnProperty.call(s.vars, a) ? s.vars[a] : 0;
    }
}

export function current (what) {
    const d = new Date();
    switch (str(what).toLowerCase()) {
    case 'year': return d.getFullYear();
    case 'month': return d.getMonth() + 1;
    case 'date': return d.getDate();
    case 'dayofweek': return d.getDay() + 1;
    case 'hour': return d.getHours();
    case 'minute': return d.getMinutes();
    case 'second': return d.getSeconds();
    default: return 0;
    }
}
export function daysSince2000 () { return (Date.now() - Date.UTC(2000, 0, 1)) / 86400000; }
