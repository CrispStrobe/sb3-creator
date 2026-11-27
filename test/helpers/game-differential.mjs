// Drive the real scratch-vm and the bwgame-v1 JS runtime through the same input
// trace and compare state. Size is not compared: headless scratch-vm ignores
// `set size` (RenderedTarget.setSize is renderer-gated). scratch-vm is pinned to one tick per frame (the
// documented bwgame scheduling model), its clock follows the frame counter, and
// `pick random` uses the same seeded mulberry32 stream, so any difference is a
// semantic difference in the exported game.
import VM from 'scratch-vm';
import Storage from 'scratch-storage';
import { Game, makeRng } from '../../src/game/runtime/bwgame.js';
import { buildGameModel } from '../../src/game/model.js';
import { emitGame } from '../../src/game/emit.js';
import { mkdtempSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const RUNTIME = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'game', 'runtime', 'bwgame.js');
const round6 = n => (typeof n === 'number' ? Math.round(n * 1e6) / 1e6 : n);
// A canonical numeric string and the number are interchangeable in every Scratch
// operation; the exporter writes literal "10" as 10, scratch-vm keeps the string.
const canon = v => (typeof v === 'string' && v.trim() !== '' && String(Number(v)) === v ? Number(v) : v);
const val = v => { v = canon(v); return typeof v === 'number' ? round6(v) : (typeof v === 'boolean' ? String(v) : v); };

// Write game.js next to a private copy of bwgame.js and import it.
export async function loadJsGame ({ project, files }, seed = 1) {
    const { manifest, code, report } = buildGameModel(project, files);
    const dir = mkdtempSync(path.join(tmpdir(), 'bwgame-'));
    copyFileSync(RUNTIME, path.join(dir, 'bwgame.js'));
    writeFileSync(path.join(dir, 'game.js'), emitGame({ manifest, code }, 'js'));
    writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    const { Game: G } = await import(pathToFileURL(path.join(dir, 'bwgame.js')).href);
    const { default: setup } = await import(pathToFileURL(path.join(dir, 'game.js')).href);
    const game = new G(manifest, { seed });
    setup(game);
    return { game, manifest, report, dir };
}

function jsState (game) {
    const sprites = game.layers.filter(s => s.alive).map(s => ({
        name: s.name, clone: s.isClone, x: round6(s.x), y: round6(s.y), direction: round6(s.direction),
        costume: s.costumeIndex + 1, visible: s.visible,
        vars: Object.fromEntries(Object.entries(s.vars).map(([k, v]) => [k, val(v)])),
        lists: Object.fromEntries(Object.entries(s.lists).map(([k, v]) => [k, v.map(val)])),
        bubble: s.bubble ? s.bubble.text : null
    }));
    return {
        backdrop: game.stage.costumeIndex + 1,
        vars: Object.fromEntries(Object.entries(game.stage.vars).map(([k, v]) => [k, val(v)])),
        lists: Object.fromEntries(Object.entries(game.stage.lists).map(([k, v]) => [k, v.map(val)])),
        sprites: sortSprites(sprites)
    };
}

function sortSprites (list) {
    return [...list].sort((a, b) => (a.name + (a.clone ? 1 : 0) + a.x + ',' + a.y).localeCompare(b.name + (b.clone ? 1 : 0) + b.x + ',' + b.y));
}

function vmState (vm) {
    const stage = vm.runtime.getTargetForStage();
    const sprites = vm.runtime.targets.filter(t => !t.isStage).map(t => {
        const bubble = t.getCustomState('Scratch.looks');
        const vars = {}, lists = {};
        for (const v of Object.values(t.variables)) {
            if (v.type === '') vars[v.name] = val(v.value);
            else if (v.type === 'list') lists[v.name] = v.value.map(val);
        }
        return {
            name: t.sprite.name, clone: !t.isOriginal, x: round6(t.x), y: round6(t.y), direction: round6(t.direction),
            costume: t.currentCostume + 1, visible: t.visible, vars, lists,
            bubble: bubble && bubble.text ? bubble.text : null
        };
    });
    const vars = {}, lists = {};
    for (const v of Object.values(stage.variables)) {
        if (v.type === '') vars[v.name] = val(v.value);
        else if (v.type === 'list') lists[v.name] = v.value.map(val);
    }
    return { backdrop: stage.currentCostume + 1, vars, lists, sprites: sortSprites(sprites) };
}

const VM_KEYS = { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', space: ' ', ' ': ' ' };

export async function runVm (sb3Bytes, trace, seed = 1) {
    let now = 0;
    const realNow = performance.now.bind(performance), realDate = Date.now;
    performance.now = () => now;
    Date.now = () => now;
    // say-for-secs and friends resolve through setTimeout + a promise; run those
    // timers on the virtual clock and flush microtasks before every frame.
    const realSetTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;
    const timers = new Map();
    let timerId = 1;
    globalThis.setTimeout = (fn, ms = 0, ...a) => { const id = timerId++; timers.set(id, { start: now, ms: Number(ms || 0), fn: () => fn(...a) }); return id; };
    globalThis.clearTimeout = (id) => { timers.delete(id); };
    const fire = async () => {
        for (const [id, t] of [...timers].sort((x, y) => (x[1].start + x[1].ms) - (y[1].start + y[1].ms))) {
            if (now - t.start >= t.ms) { timers.delete(id); t.fn(); }
        }
        for (let i = 0; i < 10; i++) await Promise.resolve();
    };
    try {
        const vm = new VM();
        vm.attachStorage(new Storage.ScratchStorage());
        await vm.loadProject(Buffer.from(sb3Bytes));
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
        const seq = vm.runtime.sequencer;
        seq.timer = { start () { this.n = 0; }, timeElapsed () { return this.n++ === 0 ? 0 : Infinity; } };
        const out = [];
        const sample = new Set(trace.sample || []);
        for (let f = 0; f < trace.frames; f++) {
            for (const e of trace.events || []) {
                if (e.frame !== f) continue;
                if (e.type === 'flag') vm.greenFlag();
                else if (e.type === 'keydown' || e.type === 'keyup') vm.postIOData('keyboard', { key: VM_KEYS[e.key] ?? e.key, isDown: e.type === 'keydown' });
                else if (e.type === 'mousemove' || e.type === 'mousedown' || e.type === 'mouseup') {
                    vm.postIOData('mouse', { x: e.x + 240, y: 180 - e.y, canvasWidth: 480, canvasHeight: 360, isDown: e.type === 'mousedown' ? true : (e.type === 'mouseup' ? false : undefined) });
                }
            }
            now = ((f + 1) * 1000) / 30;
            await fire();
            vm.runtime._step();
            if (sample.has(f + 1)) out.push({ frame: f + 1, ...vmState(vm) });
        }
        vm.stopAll();
        return out;
    } finally {
        performance.now = realNow;
        Date.now = realDate;
        globalThis.setTimeout = realSetTimeout;
        globalThis.clearTimeout = realClearTimeout;
    }
}

export function runJs (game, trace) {
    const out = [];
    const sample = new Set(trace.sample || []);
    for (let f = 0; f < trace.frames; f++) {
        for (const e of trace.events || []) {
            if (e.frame !== f) continue;
            if (e.type === 'flag') game.greenFlag();
            else if (e.type === 'keydown') game.keyDown(e.key);
            else if (e.type === 'keyup') game.keyUp(e.key);
            else if (e.type === 'mousemove') game.mouseMove(e.x, e.y);
            else if (e.type === 'mousedown') game.mouseDown(e.x, e.y);
            else if (e.type === 'mouseup') game.mouseUp();
        }
        game.step();
        if (sample.has(f + 1)) out.push({ frame: f + 1, ...jsState(game) });
    }
    return out;
}

export { Game };
