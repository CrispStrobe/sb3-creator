// examples/79-a2-sampler, executed — against the canonical extension and against
// the copy brickwright-lite actually ships.
//
// This is the runtime half of the 2026-08-22 finding. The static gates could not
// see it: the example parses, compiles, loads into the VM and steps without
// throwing, whichever extension is registered. What differs is whether anything
// HAPPENS. scratch-vm pushes a block as an operation only if its opcode has a
// registered function (engine/execute.js), so an undefined opcode is a silent
// no-op; and an undefined HAT reports getIsHat() false, so its script never
// starts at all. The green-flag script keeps running either way, which is what
// made the project look alive with a dead display and a dead keypad.
//
// So this test asserts the difference directly, in both directions:
//   - against reference/extensions/stc12.js everything resolves, the hat fires,
//     and the frame buffer holds the font bytes for the key that was pressed;
//   - against the vendored lite snapshot exactly the gap MANIFEST.json records
//     shows up, and no more.
//
// The second half is not a test of lite. It is a test that the recorded gap is
// the real one: when lite's fix lands and the snapshot is re-vendored, this
// flips to full behaviour and the expectedMissing entry must go with it.
// See test/STC12-CONFORMANCE-FINDING.md.

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import nodeVm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import VM from 'scratch-vm';
import SB3Creator from '../src/utils/sb3Creator.js';
import { snapshots } from './helpers/downstream.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const PROGRAM = join(here, '..', 'examples', '79-a2-sampler', 'program.bw');

const origWarn = console.warn;
console.warn = () => {};

const BlockType = { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat', EVENT: 'event', CONDITIONAL: 'conditional', LOOP: 'loop', BUTTON: 'button', LABEL: 'label', XML: 'xml' };
const ArgumentType = { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean', ANGLE: 'angle', COLOR: 'color', MATRIX: 'matrix', NOTE: 'note', IMAGE: 'image', COSTUME: 'costume', SOUND: 'sound' };
const Cast = {
    toNumber: (v) => { const n = Number(v); return Number.isNaN(n) ? 0 : n; },
    toString: String,
    toBoolean: (v) => (typeof v === 'boolean' ? v : (v === 'true' || (typeof v === 'number' && v !== 0) || (typeof v === 'string' && v !== '' && v !== '0' && v.toLowerCase() !== 'false'))),
    compare: (a, b) => { const x = Number(a), y = Number(b); if (!Number.isNaN(x) && !Number.isNaN(y)) return x - y; const p = String(a).toLowerCase(), q = String(b).toLowerCase(); return p < q ? -1 : p > q ? 1 : 0; },
    toListIndex: (i, len) => { const n = Math.floor(Number(i)); return (n < 1 || n > len) ? 0 : n; }
};
const permissive = () => new Proxy(function () {}, {
    get: (t, k) => (k === 'then' ? undefined : permissive()), apply: () => permissive(), construct: () => permissive() });

/**
 * Run an extension source against a real runtime.
 *
 * The real globals are handed in explicitly rather than left to the permissive
 * proxy. That is not tidiness: stc12's board store is `Object.create(null)`, and
 * with a proxied `Object` it becomes a proxy, `Object.keys` over it misbehaves,
 * and the hat throws "Cannot convert object to primitive value" — an instrument
 * failure that reads exactly like a bug in the extension.
 */
function loadExtensionSource (source, runtime) {
    let captured = null;
    const Scratch = {
        BlockType, ArgumentType, Cast, TargetType: { SPRITE: 'sprite', STAGE: 'stage' },
        translate: Object.assign((m) => (m && typeof m === 'object' ? (m.default || '') : m), { setup: () => {} }),
        extensions: { register: (inst) => { captured = inst; }, unsandboxed: true, isPenguinMod: false },
        vm: { runtime }
    };
    const known = { Object, Array, Number, String, Math, JSON, Boolean, Error, isNaN, parseInt,
        parseFloat, Symbol, Map, Set, Promise, Scratch,
        console: new Proxy({}, { get: () => () => {} }),
        setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
        module: { exports: null }, exports: {} };
    const sandbox = new Proxy(known, { has: () => true, get: (t, k) => (k in t ? t[k] : (t[k] = permissive())) });
    nodeVm.createContext(sandbox);
    nodeVm.runInContext(source, sandbox, { timeout: 5000 });
    if (!captured) throw new Error('extension registered nothing');
    return captured;
}

async function runSampler (extensionSource) {
    const creator = new SB3Creator();
    creator.parse(readFileSync(PROGRAM, 'utf8'));
    const buf = Buffer.from(await (await creator.generateSB3()).arrayBuffer());

    const vm = new VM();
    let instance = null;
    const em = vm.extensionManager;
    em.loadExtensionURL = (url) => {
        instance = loadExtensionSource(extensionSource, vm.runtime);
        em._loadedExtensions.set(url, em._registerInternalExtension(instance));
        return Promise.resolve();
    };
    await vm.loadProject(buf);

    const used = new Set();
    for (const target of vm.runtime.targets) {
        for (const block of Object.values(target.blocks._blocks || {})) {
            if (block.opcode?.startsWith('stc12_')) used.add(block.opcode);
        }
    }
    const undefinedOpcodes = [...used]
        .filter((op) => typeof vm.runtime.getOpcodeFunction(op) === 'undefined').sort();

    vm.start();
    vm.greenFlag();
    for (let i = 0; i < 20; i++) vm.runtime._step();
    const readVars = () => Object.fromEntries(vm.runtime.targets
        .flatMap((t) => Object.values(t.variables)).map((v) => [v.name, v.value]));
    const before = readVars().running;

    // Stand in for the board layer's keypad scanner: press key 14, then release.
    // The example's `WHEN key 14 pressed` toggles `running`.
    if (!vm.runtime._stc12Pins) vm.runtime._stc12Pins = Object.create(null);
    vm.runtime._stc12Pins.keypad_keys = 14;
    for (let i = 0; i < 10; i++) vm.runtime._step();
    vm.runtime._stc12Pins.keypad_keys = -1;
    for (let i = 0; i < 30; i++) vm.runtime._step();
    const after = readVars().running;

    vm.quit();
    return { undefinedOpcodes, isHat: vm.runtime.getIsHat('stc12_whenkey'),
        hatFired: String(before) !== String(after), segs: instance?._segs || null,
        banks: instance?._banks || null, used };
}

// scratch-vm's vm.start() registers a setInterval; a test that fails before
// quit() keeps the process alive indefinitely.
const active = new Set();
const origStart = VM.prototype.start;
VM.prototype.start = function () { active.add(this); return origStart.call(this); };
const origQuit = VM.prototype.quit;
VM.prototype.quit = function () { active.delete(this); return origQuit.call(this); };

describe('79-a2-sampler in the real VM', { concurrency: 1 }, () => {
    afterEach(() => { for (const vm of active) { try { vm.quit(); } catch { /* already gone */ } } active.clear(); });

    test('against the canonical copy: every verb resolves and the board responds', async () => {
        const r = await runSampler(readFileSync(resolve(here, '../reference/extensions/stc12.js'), 'utf8'));

        assert.deepStrictEqual(r.undefinedOpcodes, [],
            `these opcodes have no runtime function, so they execute as silent no-ops: ${r.undefinedOpcodes.join(', ')}`);
        assert.strictEqual(r.isHat, true,
            'stc12_whenkey must register as a hat, or its scripts never start');
        assert.ok(r.hatFired,
            '`WHEN key 14 pressed` did not fire: `running` never changed while key 14 was held. ' +
            'This is what an undefined or mis-typed hat looks like from the outside — the ' +
            'project still runs, it just never reacts.');

        // `show number keys on display` writes the 7-seg frame buffer. Key 14 held
        // means digits "1" and "4": 0x06 and 0x66 in the standard segment font.
        // Asserting the bytes, not just that something was written, is the point —
        // a display that lights the wrong thing passes any "did it run" check.
        assert.ok(r.segs?.display, 'the SEVENSEG8 frame buffer was never created');
        assert.deepStrictEqual(r.segs.display.slice(6), [0x06, 0x66],
            `the two right-hand digits should read "14" (0x06, 0x66); got ${JSON.stringify(r.segs.display)}`);

        // `light only led step on leds` writes the LEDBANK8 shadow byte, which must
        // always be a single set bit.
        assert.ok(r.banks && 'leds' in r.banks, 'the LEDBANK8 shadow byte was never created');
        const shadow = r.banks.leds;
        assert.strictEqual(shadow & (shadow - 1), 0,
            `"light only" must leave exactly one bit set, got 0b${shadow.toString(2)}`);
    });

    test('against the copy lite ships: exactly the recorded gap, and no more', async () => {
        const snap = snapshots().find((s) => s.name === 'lite-stc12');
        const r = await runSampler(snap.inner);

        const recorded = new Set(snap.entry.expectedMissing || []);
        const bare = r.undefinedOpcodes.map((op) => op.slice('stc12_'.length));
        const surprises = bare.filter((op) => !recorded.has(op));
        assert.deepStrictEqual(surprises, [],
            `the shipped copy leaves opcodes undefined that MANIFEST.json does not record: ${surprises.join(', ')}`);

        // And the consequence, asserted rather than described: while the gap is open
        // the hat is not a hat, so the example's two key scripts never start. When
        // lite's fix lands and the snapshot is re-vendored, this assertion flips and
        // has to be updated together with expectedMissing — which is the point.
        if (recorded.has('whenkey')) {
            assert.strictEqual(r.isHat, false, 'expected whenkey to be unrecognised while the gap is open');
            assert.strictEqual(r.hatFired, false,
                'expected `WHEN key 14 pressed` never to fire while stc12_whenkey is undefined');
        } else {
            assert.strictEqual(r.isHat, true, 'whenkey is no longer a recorded gap, so it must be a hat');
            assert.ok(r.hatFired, 'whenkey is defined now, so the key script must fire');
        }
    });
});

console.warn = origWarn;
