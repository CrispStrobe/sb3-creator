// Conformance: the two copies of the stc12 extension (gallery + bundled) must expose
// exactly the opcodes sb3-creator emits, with identical argument shapes.
//
// Three things agree, or projects round-trip wrong:
//   1. sb3-creator emits  stc12_* opcodes (derived by scanning sb3Creator.js)
//   2. gallery copy       extensions/CrispStrobe/stc12.js (fetched at runtime)
//   3. bundled copy       lite/overlay/.../crispstrobe/stc12/index.js (string literal)
//
// A menu with acceptReporters:false compiles to a FIELD. If either copy changes that,
// saved projects silently break: fields become inputs with shadow blocks, and no longer
// match what sb3-creator wrote.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ---- helpers ----------------------------------------------------------------

/** Run an extension source string in a minimal Scratch shim, return getInfo(). */
function loadExtension(source) {
    const registered = [];
    const Scratch = {
        BlockType: { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', HAT: 'hat' },
        ArgumentType: { STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean', COLOR: 'color' },
        extensions: { register(ext) { registered.push(ext); } },
        translate: (obj) => obj.default || obj,  // identity — returns the default-locale string
        vm: { runtime: { stc: { pins: [{ name: 'P1_0', activeLow: false }], ports: [], parts: [], tables: [{ name: 'font', values: [0x3F] }] } } }
    };
    const fn = new Function('Scratch', source);
    fn(Scratch);
    assert.ok(registered.length > 0, 'extension must register');
    return registered[0].getInfo();
}

/** Extract the source string from a makeExt(`...`) wrapper. */
function extractInlinedSource(wrapperCode) {
    const m = wrapperCode.match(/makeExt\(`([\s\S]*)`\);?\s*$/);
    assert.ok(m, 'could not extract inlined source from makeExt(...)');
    return m[1];
}

// ---- load all three copies ---------------------------------------------------

// The sibling checkouts are not laid out the same way on every machine: the VPS has
// `extensions/` and `bw-bundle/lite/` beside this repo, a workstation has them under
// `lego/brickwright-lite/`. A single hardcoded path means four of the five tests skip
// silently on the other machine — and a skipped conformance test looks exactly like a
// passing one in the summary line. So try each known layout, and let an env var win.
function findCopy (envVar, ...candidates) {
    const fromEnv = process.env[envVar];
    if (fromEnv) {
        // An explicit pointer that does not resolve is an error, not a skip: someone
        // set it meaning to run the check, and silently skipping would hide that.
        return { path: fromEnv, source: readFileSync(fromEnv, 'utf8') };
    }
    for (const rel of candidates) {
        const path = resolve(here, rel);
        try { return { path, source: readFileSync(path, 'utf8') }; } catch { /* next */ }
    }
    return {};
}

const gallery = findCopy('BW_GALLERY',
    '../../extensions/extensions/CrispStrobe/stc12.js',
    '../../lego/extensions/extensions/CrispStrobe/stc12.js');
const bundled = findCopy('BW_LITE_STC12',
    '../../bw-bundle/lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js',
    '../../lego/brickwright-lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js');
const reference = findCopy('BW_REFERENCE_STC12', '../reference/extensions/stc12.js');

const gallerySource = gallery.source;
const bundledWrapper = bundled.source;
const referenceSource = reference.source;

// ---- the opcodes sb3-creator emits (derived, not hand-maintained) ------------
// Scan sb3Creator.js for every stc12_* opcode created by createBlock / cmd / B / push.
// Matching the creation call rather than the bare string means no exclusion list is
// needed (_stc12_pins is a variable name, not a createBlock call, so it never appears).

const sb3CreatorSource = readFileSync(resolve(here, '../src/utils/sb3Creator.js'), 'utf8');
const EMITTED_OPCODES = new Set();
const EMITTER_ARGS = {};  // opcode → Set of argument names the emitter writes

for (const m of sb3CreatorSource.matchAll(/(?:createBlock|cmd)\('stc12_([a-z0-9_]+)'/g)) {
    const op = m[1];
    EMITTED_OPCODES.add(op);
    if (!EMITTER_ARGS[op]) EMITTER_ARGS[op] = new Set();
    // Scan the 400 chars after the call for fields.X and inputs.X assignments.
    const after = sb3CreatorSource.slice(m.index, m.index + 400);
    for (const f of after.matchAll(/(?:fields|inputs)\.([A-Z_]+)\s*=/g)) EMITTER_ARGS[op].add(f[1]);
}
for (const m of sb3CreatorSource.matchAll(/(?:B|push)\('stc12_([a-z0-9_]+)',\s*\{[^}]*\},\s*\{([^}]*)\}/g)) {
    const op = m[1];
    EMITTED_OPCODES.add(op);
    if (!EMITTER_ARGS[op]) EMITTER_ARGS[op] = new Set();
    for (const f of m[2].matchAll(/([A-Z_]+)\s*:/g)) EMITTER_ARGS[op].add(f[1]);
}

// ---- assert a getInfo matches the emitted opcodes ---------------------------

function assertConformance(info, label) {
    const blocksByOpcode = Object.fromEntries(
        info.blocks.filter(b => typeof b === 'object').map(b => [b.opcode, b])
    );

    // Every emitted opcode must exist in the extension
    for (const op of EMITTED_OPCODES) {
        assert.ok(blocksByOpcode[op], `${label}: missing opcode "${op}" (sb3-creator emits stc12_${op})`);
    }

    // The extension's argument names must match what the emitter writes.
    // A renamed argument silently breaks every saved project's field binding.
    for (const op of EMITTED_OPCODES) {
        const block = blocksByOpcode[op];
        if (!block) continue;
        const emitterArgs = EMITTER_ARGS[op];
        // Every stc12 opcode takes at least one argument. If the deriver found
        // none, the 400-char scan window missed the assignments — fail loudly
        // rather than silently skipping the argument check.
        assert.ok(emitterArgs && emitterArgs.size > 0,
            `${label}: stc12_${op} — deriver found no argument names (scan window too small or opcode takes none)`);
        const declared = new Set(Object.keys(block.arguments || {}));
        for (const arg of emitterArgs) {
            assert.ok(declared.has(arg),
                `${label}: stc12_${op} — emitter writes "${arg}" but getInfo() does not declare it`);
        }
    }

    // Every menu referenced by any block must have acceptReporters:false (→ FIELD)
    const menus = info.menus || {};
    for (const block of Object.values(blocksByOpcode)) {
        for (const [argName, arg] of Object.entries(block.arguments || {})) {
            if (arg.menu) {
                const menu = menus[arg.menu];
                assert.ok(menu, `${label}: ${block.opcode}.${argName} references menu "${arg.menu}" which does not exist`);
                assert.strictEqual(menu.acceptReporters, false,
                    `${label}: menu "${arg.menu}" must have acceptReporters:false (FIELD, not input)`);
            }
        }
    }
}

// ---- tests ------------------------------------------------------------------

test('gallery stc12 extension matches emitted opcodes', { skip: !gallerySource && 'gallery file not found' }, () => {
    // Gallery source is an IIFE: (function(Scratch) { ... })(Scratch);
    const info = loadExtension(gallerySource);
    assert.strictEqual(info.id, 'stc12');
    assertConformance(info, 'gallery');
});

test('bundled stc12 extension matches emitted opcodes', { skip: !bundledWrapper && 'bundled file not found' }, () => {
    const source = extractInlinedSource(bundledWrapper);
    const info = loadExtension(source);
    assert.strictEqual(info.id, 'stc12');
    assertConformance(info, 'bundled');
});

test('reference copy matches emitted opcodes', { skip: !referenceSource && 'reference file not found' }, () => {
    const info = loadExtension(referenceSource);
    assert.strictEqual(info.id, 'stc12');
    assertConformance(info, 'reference');
});

// Compare whatever copies this machine actually has, rather than all-or-nothing.
// Requiring all three meant a workstation without the gallery checkout skipped the
// comparison entirely — and bundled-vs-reference disagreeing is just as much a bug as
// all three disagreeing. Two is enough to compare; one is not a comparison.
const availableCopies = {};
if (gallerySource) availableCopies.gallery = () => loadExtension(gallerySource);
if (bundledWrapper) availableCopies.bundled = () => loadExtension(extractInlinedSource(bundledWrapper));
if (referenceSource) availableCopies.reference = () => loadExtension(referenceSource);

test('the stc12 copies present on this machine have identical block shapes', {
    skip: Object.keys(availableCopies).length < 2 &&
        `need two copies to compare, found ${Object.keys(availableCopies).join(', ') || 'none'}`
}, () => {
    const copies = Object.fromEntries(
        Object.entries(availableCopies).map(([name, load]) => [name, load()]));

    // Collect blocks by opcode from each copy
    const byOp = {};
    for (const [name, info] of Object.entries(copies)) {
        byOp[name] = Object.fromEntries(
            info.blocks.filter(b => typeof b === 'object').map(b => [b.opcode, b])
        );
    }

    // Opcodes every present copy has
    const names = Object.keys(copies);
    const shared = Object.keys(byOp[names[0]]).filter(op => names.every(n => byOp[n][op]));
    assert.ok(shared.length >= EMITTED_OPCODES.size,
        `${names.join(' + ')} must share at least the ${EMITTED_OPCODES.size} emitted opcodes (shared: ${shared.length})`);

    // For each shared opcode, every present copy must agree on blockType and arg shapes
    for (const op of shared) {
        for (let i = 1; i < names.length; i++) {
            const a = byOp[names[0]][op], b = byOp[names[i]][op];
            assert.strictEqual(a.blockType, b.blockType,
                `${op}: blockType mismatch between ${names[0]} and ${names[i]}`);

            const aArgs = Object.entries(a.arguments || {}).sort(([x], [y]) => x.localeCompare(y));
            const bArgs = Object.entries(b.arguments || {}).sort(([x], [y]) => x.localeCompare(y));
            assert.deepStrictEqual(
                aArgs.map(([k, v]) => [k, v.type, v.menu || null]),
                bArgs.map(([k, v]) => [k, v.type, v.menu || null]),
                `${op}: argument shapes differ between ${names[0]} and ${names[i]}`
            );
        }
    }

    // For shared menus, acceptReporters must match across all copies
    for (let i = 1; i < Object.keys(copies).length; i++) {
        const nameA = Object.keys(copies)[0], nameB = Object.keys(copies)[i];
        const menusA = copies[nameA].menus || {};
        const menusB = copies[nameB].menus || {};
        for (const name of Object.keys(menusA).filter(n => menusB[n])) {
            assert.strictEqual(menusA[name].acceptReporters, menusB[name].acceptReporters,
                `menu "${name}": acceptReporters mismatch between ${nameA} and ${nameB}`);
        }
    }
});

// ---- stc12live: copy agreement (no emitter, runtime-only extension) ---------

const stc12liveGallery = findCopy('BW_GALLERY_STC12LIVE',
    '../../extensions/extensions/CrispStrobe/stc12live.js',
    '../../lego/extensions/extensions/CrispStrobe/stc12live.js').source;
const stc12liveBundled = findCopy('BW_LITE_STC12LIVE',
    '../../bw-bundle/lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12live/index.js',
    '../../lego/brickwright-lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12live/index.js').source;
const stc12liveRef = findCopy('BW_REFERENCE_STC12LIVE', '../reference/extensions/stc12live.js').source;

const availableLive = {};
if (stc12liveGallery) availableLive.gallery = () => loadExtension(stc12liveGallery);
if (stc12liveBundled) availableLive.bundled = () => loadExtension(extractInlinedSource(stc12liveBundled));
if (stc12liveRef) availableLive.reference = () => loadExtension(stc12liveRef);

test('the stc12live copies present on this machine have identical block shapes', {
    skip: Object.keys(availableLive).length < 2 &&
        `need two copies to compare, found ${Object.keys(availableLive).join(', ') || 'none'}`
}, () => {
    const copies = Object.fromEntries(
        Object.entries(availableLive).map(([name, load]) => [name, load()]));

    const names = Object.keys(copies);
    for (const name of names) {
        assert.strictEqual(copies[name].id, 'stc12live', `${name} copy must register as stc12live`);
    }
    const byOp = {};
    for (const name of names) {
        byOp[name] = Object.fromEntries(
            copies[name].blocks.filter(b => typeof b === 'object').map(b => [b.opcode, b])
        );
    }

    // All shared opcodes must have identical shapes
    const allOps = new Set(Object.keys(byOp[names[0]]));
    for (let i = 1; i < names.length; i++) {
        for (const op of allOps) {
            const a = byOp[names[0]][op], b = byOp[names[i]][op];
            if (!b) continue; // extra in one copy is ok
            assert.strictEqual(a.blockType, b.blockType,
                `stc12live ${op}: blockType mismatch between ${names[0]} and ${names[i]}`);
            const aArgs = Object.entries(a.arguments || {}).sort(([x], [y]) => x.localeCompare(y));
            const bArgs = Object.entries(b.arguments || {}).sort(([x], [y]) => x.localeCompare(y));
            assert.deepStrictEqual(
                aArgs.map(([k, v]) => [k, v.type, v.menu || null]),
                bArgs.map(([k, v]) => [k, v.type, v.menu || null]),
                `stc12live ${op}: argument shapes differ between ${names[0]} and ${names[i]}`
            );
        }
    }

    // Shared menus must agree on acceptReporters
    for (let i = 1; i < names.length; i++) {
        const menusA = copies[names[0]].menus || {};
        const menusB = copies[names[i]].menus || {};
        for (const name of Object.keys(menusA).filter(n => menusB[n])) {
            assert.strictEqual(menusA[name].acceptReporters, menusB[name].acceptReporters,
                `stc12live menu "${name}": acceptReporters mismatch`);
        }
    }
});

// ---- ledcube: conformance across copies + emitter agreement ----------------

const ledcubeGallery = findCopy('BW_GALLERY_LEDCUBE',
    '../../extensions/extensions/CrispStrobe/ledcube.js');
const ledcubeRef = findCopy('BW_REFERENCE_LEDCUBE', '../reference/extensions/ledcube.js');

// Derive EMITTED_LEDCUBE_OPCODES the same way as stc12, from createBlock/cmd/B/push.
// Use `return` as the scan boundary instead of a fixed 400-char window, because
// ledcube blocks are packed close together and the window picks up neighbours.
const EMITTED_LEDCUBE = new Set();
const LEDCUBE_ARGS = {};
for (const m of sb3CreatorSource.matchAll(/(?:createBlock|cmd)\('ledcube_([a-z0-9_]+)'/g)) {
    EMITTED_LEDCUBE.add(m[1]);
    if (!LEDCUBE_ARGS[m[1]]) LEDCUBE_ARGS[m[1]] = new Set();
    const afterFull = sb3CreatorSource.slice(m.index, m.index + 400);
    const retIdx = afterFull.indexOf('return ret(');
    const after = retIdx > 0 ? afterFull.slice(0, retIdx) : afterFull;
    for (const f of after.matchAll(/(?:fields|inputs)\.([A-Z_]+)\s*=/g)) LEDCUBE_ARGS[m[1]].add(f[1]);
}
for (const m of sb3CreatorSource.matchAll(/(?:B|push)\('ledcube_([a-z0-9_]+)',\s*\{[^}]*\},?\s*\{([^}]*)\}/g)) {
    EMITTED_LEDCUBE.add(m[1]);
    if (!LEDCUBE_ARGS[m[1]]) LEDCUBE_ARGS[m[1]] = new Set();
    for (const f of m[2].matchAll(/([A-Z_]+)\s*:/g)) LEDCUBE_ARGS[m[1]].add(f[1]);
}

test('ledcube extension matches emitted opcodes', {
    skip: !ledcubeGallery.source && !ledcubeRef.source && 'no ledcube copy found'
}, () => {
    const source = ledcubeGallery.source || ledcubeRef.source;
    const info = loadExtension(source);
    assert.strictEqual(info.id, 'ledcube');

    const blocksByOpcode = Object.fromEntries(
        info.blocks.filter(b => typeof b === 'object').map(b => [b.opcode, b])
    );

    // Every emitted opcode must exist in the extension.
    for (const op of EMITTED_LEDCUBE) {
        assert.ok(blocksByOpcode[op], `ledcube: missing opcode "${op}" (sb3-creator emits ledcube_${op})`);
    }

    // Argument names must match what the emitter writes.
    for (const op of EMITTED_LEDCUBE) {
        const block = blocksByOpcode[op];
        if (!block) continue;
        const emitterArgs = LEDCUBE_ARGS[op];
        if (!emitterArgs || emitterArgs.size === 0) continue;
        const declared = new Set(Object.keys(block.arguments || {}));
        for (const arg of emitterArgs) {
            assert.ok(declared.has(arg),
                `ledcube_${op} — emitter writes "${arg}" but getInfo() does not declare it`);
        }
    }

    // Menus must be acceptReporters:false.
    const menus = info.menus || {};
    for (const block of Object.values(blocksByOpcode)) {
        for (const [argName, arg] of Object.entries(block.arguments || {})) {
            if (arg.menu) {
                const menu = menus[arg.menu];
                assert.ok(menu, `ledcube: ${block.opcode}.${argName} references missing menu "${arg.menu}"`);
                assert.strictEqual(menu.acceptReporters, false,
                    `ledcube: menu "${arg.menu}" must have acceptReporters:false`);
            }
        }
    }
});

test('ledcube copies agree on block shapes', {
    skip: (!ledcubeGallery.source || !ledcubeRef.source) && 'need both gallery and reference copies'
}, () => {
    const gInfo = loadExtension(ledcubeGallery.source);
    const rInfo = loadExtension(ledcubeRef.source);
    const gBlocks = Object.fromEntries(gInfo.blocks.filter(b => typeof b === 'object').map(b => [b.opcode, b]));
    const rBlocks = Object.fromEntries(rInfo.blocks.filter(b => typeof b === 'object').map(b => [b.opcode, b]));
    for (const op of Object.keys(gBlocks)) {
        const r = rBlocks[op];
        if (!r) continue;
        assert.strictEqual(gBlocks[op].blockType, r.blockType, `ledcube ${op}: blockType mismatch`);
        const gArgs = Object.entries(gBlocks[op].arguments || {}).sort(([a],[b]) => a.localeCompare(b));
        const rArgs = Object.entries(r.arguments || {}).sort(([a],[b]) => a.localeCompare(b));
        assert.deepStrictEqual(
            gArgs.map(([k,v]) => [k, v.type, v.menu || null]),
            rArgs.map(([k,v]) => [k, v.type, v.menu || null]),
            `ledcube ${op}: argument shapes differ`
        );
    }
});
