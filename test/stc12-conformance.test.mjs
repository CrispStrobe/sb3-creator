// Conformance: the two copies of the stc12 extension (gallery + bundled) must expose
// exactly the opcodes sb3-creator emits, with identical argument shapes.
//
// Three things agree, or projects round-trip wrong:
//   1. sb3-creator emits  stc12_setpin, stc12_writepin, stc12_toggle, stc12_read
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
        vm: { runtime: { stc: { pins: [{ name: 'P1_0', activeLow: false }] } } }
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

// ---- the opcodes sb3-creator emits ------------------------------------------

const EMITTED_OPCODES = {
    setpin:   { args: ['STATE', 'PIN'], fields: ['STATE', 'PIN'] },
    writepin: { args: ['PIN', 'VALUE'], fields: ['PIN'] },
    toggle:   { args: ['PIN'], fields: ['PIN'] },
    read:     { args: ['PIN'], fields: ['PIN'] },
};

// ---- assert a getInfo matches the emitted opcodes ---------------------------

function assertConformance(info, label) {
    const blocksByOpcode = Object.fromEntries(
        info.blocks.filter(b => typeof b === 'object').map(b => [b.opcode, b])
    );

    // Every emitted opcode must exist
    for (const op of Object.keys(EMITTED_OPCODES)) {
        assert.ok(blocksByOpcode[op], `${label}: missing opcode "${op}"`);
    }

    // No extra opcodes (unless explicitly expected)
    const extraOps = Object.keys(blocksByOpcode).filter(op => !EMITTED_OPCODES[op]);
    // readport is acceptable if present (sb3-creator emits it too)
    const unexpected = extraOps.filter(op => op !== 'readport');
    assert.deepStrictEqual(unexpected, [], `${label}: unexpected opcodes: ${unexpected}`);

    // Argument names match
    for (const [op, expect] of Object.entries(EMITTED_OPCODES)) {
        const block = blocksByOpcode[op];
        const argNames = Object.keys(block.arguments || {});
        assert.deepStrictEqual(argNames.sort(), [...expect.args].sort(),
            `${label}: ${op} argument names`);
    }

    // Menus that field-arguments reference must have acceptReporters:false
    const menus = info.menus || {};
    for (const [op, expect] of Object.entries(EMITTED_OPCODES)) {
        const block = blocksByOpcode[op];
        for (const fieldArg of expect.fields) {
            const arg = block.arguments[fieldArg];
            if (arg.menu) {
                const menu = menus[arg.menu];
                assert.ok(menu, `${label}: ${op}.${fieldArg} references menu "${arg.menu}" which does not exist`);
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

test('gallery and bundled copies have identical block shapes', {
    skip: (!gallerySource || !bundledWrapper) && 'one or both files not found'
}, () => {
    const galleryInfo = loadExtension(gallerySource);
    const bundledInfo = loadExtension(extractInlinedSource(bundledWrapper));

    const gBlocks = galleryInfo.blocks.filter(b => typeof b === 'object');
    const bBlocks = bundledInfo.blocks.filter(b => typeof b === 'object');

    for (const gb of gBlocks) {
        const bb = bBlocks.find(b => b.opcode === gb.opcode);
        assert.ok(bb, `bundled missing opcode "${gb.opcode}" that gallery has`);
        assert.strictEqual(gb.blockType, bb.blockType, `${gb.opcode}: blockType mismatch`);

        const gArgs = Object.entries(gb.arguments || {}).sort(([a], [b]) => a.localeCompare(b));
        const bArgs = Object.entries(bb.arguments || {}).sort(([a], [b]) => a.localeCompare(b));
        assert.deepStrictEqual(
            gArgs.map(([k, v]) => [k, v.type, v.menu || null]),
            bArgs.map(([k, v]) => [k, v.type, v.menu || null]),
            `${gb.opcode}: argument shapes differ`
        );
    }

    // Check menus match
    for (const [name, gMenu] of Object.entries(galleryInfo.menus || {})) {
        const bMenu = bundledInfo.menus[name];
        assert.ok(bMenu, `bundled missing menu "${name}"`);
        assert.strictEqual(gMenu.acceptReporters, bMenu.acceptReporters,
            `menu "${name}": acceptReporters mismatch`);
    }
});
