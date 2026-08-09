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

// ---- load both copies -------------------------------------------------------

const galleryPath = resolve(here, '../../extensions/extensions/CrispStrobe/stc12.js');
const bundledPath = resolve(here, '../../bw-bundle/lite/overlay/scratch-vm/src/extensions/crispstrobe/stc12/index.js');

let gallerySource, bundledWrapper;
try { gallerySource = readFileSync(galleryPath, 'utf8'); } catch { /* skip */ }
try { bundledWrapper = readFileSync(bundledPath, 'utf8'); } catch { /* skip */ }

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

test('shared stc12 opcodes have identical block shapes across copies', {
    skip: (!gallerySource || !bundledWrapper) && 'one or both files not found'
}, () => {
    const galleryInfo = loadExtension(gallerySource);
    const bundledInfo = loadExtension(extractInlinedSource(bundledWrapper));

    const gBlocks = galleryInfo.blocks.filter(b => typeof b === 'object');
    const bBlocks = bundledInfo.blocks.filter(b => typeof b === 'object');
    const gByOp = Object.fromEntries(gBlocks.map(b => [b.opcode, b]));
    const bByOp = Object.fromEntries(bBlocks.map(b => [b.opcode, b]));

    // For every opcode that exists in BOTH copies, shapes must match.
    // Extra opcodes in either copy are fine — the gallery may gain blocks
    // before the bundled copy is updated, and vice versa.
    const shared = Object.keys(gByOp).filter(op => bByOp[op]);
    assert.ok(shared.length >= EMITTED_OPCODES.size,
        'both copies must at least share the emitted opcodes');

    for (const op of shared) {
        const gb = gByOp[op], bb = bByOp[op];
        assert.strictEqual(gb.blockType, bb.blockType, `${op}: blockType mismatch`);

        const gArgs = Object.entries(gb.arguments || {}).sort(([a], [b]) => a.localeCompare(b));
        const bArgs = Object.entries(bb.arguments || {}).sort(([a], [b]) => a.localeCompare(b));
        assert.deepStrictEqual(
            gArgs.map(([k, v]) => [k, v.type, v.menu || null]),
            bArgs.map(([k, v]) => [k, v.type, v.menu || null]),
            `${op}: argument shapes differ between gallery and bundled`
        );
    }

    // For shared menus, acceptReporters must match
    const gMenus = galleryInfo.menus || {};
    const bMenus = bundledInfo.menus || {};
    for (const name of Object.keys(gMenus).filter(n => bMenus[n])) {
        assert.strictEqual(gMenus[name].acceptReporters, bMenus[name].acceptReporters,
            `menu "${name}": acceptReporters mismatch between copies`);
    }
});
