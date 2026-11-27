// Reference oracle for the game export: vanilla scratch-vm WITH the real WebGL
// renderer (collisions, edges, fencing, size limits, mouse hover all real), driven by
// the same deterministic protocol as test/helpers/game-differential.mjs:
//   - one sequencer tick per frame, a clock that follows the frame counter,
//   - `pick random` from the shared seeded mulberry32 stream,
//   - setTimeout-based blocks (say/think for secs) on the virtual clock.
// It returns the same state samples, so a scorer can compare them with the exported
// game's runtime frame by frame. Bundled by test/browser/build.mjs.
import VM from 'scratch-vm';
import ScratchRender from 'scratch-render';
import { ScratchStorage } from 'scratch-storage';
import { BitmapAdapter } from 'scratch-svg-renderer';

function makeRng (seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const round6 = n => (typeof n === 'number' ? Math.round(n * 1e6) / 1e6 : n);
const canon = v => (typeof v === 'string' && v.trim() !== '' && String(Number(v)) === v ? Number(v) : v);
const val = v => { v = canon(v); return typeof v === 'number' ? round6(v) : (typeof v === 'boolean' ? String(v) : v); };
const sortSprites = list => [...list].sort((a, b) =>
    (a.name + (a.clone ? 1 : 0) + a.x + ',' + a.y).localeCompare(b.name + (b.clone ? 1 : 0) + b.x + ',' + b.y));

function state (vm, withSize) {
    const pack = t => {
        const vars = {}, lists = {};
        for (const v of Object.values(t.variables)) {
            if (v.type === '') vars[v.name] = val(v.value);
            else if (v.type === 'list') lists[v.name] = v.value.map(val);
        }
        return { vars, lists };
    };
    const stage = vm.runtime.getTargetForStage();
    const sprites = vm.runtime.targets.filter(t => !t.isStage).map(t => {
        const bubble = t.getCustomState('Scratch.looks');
        const { vars, lists } = pack(t);
        return {
            name: t.sprite.name, clone: !t.isOriginal, x: round6(t.x), y: round6(t.y), direction: round6(t.direction),
            ...(withSize ? { size: round6(t.size) } : {}),
            costume: t.currentCostume + 1, visible: t.visible, vars, lists,
            bubble: bubble && bubble.text ? bubble.text : null
        };
    });
    const { vars, lists } = pack(stage);
    return { backdrop: stage.currentCostume + 1, vars, lists, sprites: sortSprites(sprites) };
}

const VM_KEYS = { space: ' ' };

window.ORACLE = {
    async run (base64, trace, seed = 1, withSize = false) {
        const bin = atob(base64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const canvas = document.getElementById('stage');
        const vm = new VM();
        vm.attachStorage(new ScratchStorage());
        const renderer = new ScratchRender(canvas);
        vm.attachRenderer(renderer);
        vm.attachV2BitmapAdapter(new BitmapAdapter());
        await vm.loadProject(buf.buffer);
        // Costume skins decode asynchronously; collisions need them in place.
        await new Promise(r => setTimeout(r, 800));

        const rng = makeRng(seed);
        const isInt = v => (typeof v === 'number' ? Number.isInteger(v) : !String(v).includes('.'));
        vm.runtime._primitives.operator_random = (args) => {
            const lo = Number(args.FROM) || 0, hi = Number(args.TO) || 0;
            const low = Math.min(lo, hi), high = Math.max(lo, hi);
            if (low === high) return low;
            if (isInt(args.FROM) && isInt(args.TO)) return low + Math.floor(rng() * ((high + 1) - low));
            return (rng() * (high - low)) + low;
        };
        vm.runtime.currentStepTime = 1000 / 30;
        vm.runtime.sequencer.timer = { start () { this.n = 0; }, timeElapsed () { return this.n++ === 0 ? 0 : Infinity; } };

        // Virtual clock and timers for the duration of the run only.
        let now = 0;
        const real = { pnow: performance.now.bind(performance), dnow: Date.now, st: window.setTimeout, ct: window.clearTimeout };
        const timers = new Map();
        let tid = 1;
        performance.now = () => now;
        Date.now = () => now;
        window.setTimeout = (fn, ms = 0, ...a) => { const id = tid++; timers.set(id, { start: now, ms: Number(ms || 0), fn: () => fn(...a) }); return id; };
        window.clearTimeout = id => { timers.delete(id); };
        const out = [];
        try {
            const sample = new Set(trace.sample || []);
            for (let f = 0; f < trace.frames; f++) {
                for (const e of trace.events || []) {
                    if (e.frame !== f) continue;
                    if (e.type === 'flag') vm.greenFlag();
                    else if (e.type === 'keydown' || e.type === 'keyup') vm.postIOData('keyboard', { key: VM_KEYS[e.key] ?? e.key, isDown: e.type === 'keydown' });
                    else if (e.type === 'mousemove' || e.type === 'mousedown' || e.type === 'mouseup') {
                        vm.postIOData('mouse', { x: (e.x ?? 0) + 240, y: 180 - (e.y ?? 0), canvasWidth: 480, canvasHeight: 360,
                            isDown: e.type === 'mousedown' ? true : (e.type === 'mouseup' ? false : undefined) });
                    }
                }
                now = ((f + 1) * 1000) / 30;
                for (const [id, t] of [...timers].sort((x, y) => (x[1].start + x[1].ms) - (y[1].start + y[1].ms))) {
                    if (now - t.start >= t.ms) { timers.delete(id); t.fn(); }
                }
                for (let i = 0; i < 10; i++) await Promise.resolve();
                vm.runtime._step();
                if (sample.has(f + 1)) out.push({ frame: f + 1, ...state(vm, withSize) });
            }
        } finally {
            performance.now = real.pnow; Date.now = real.dnow; window.setTimeout = real.st; window.clearTimeout = real.ct;
            vm.stopAll();
        }
        return out;
    }
};
