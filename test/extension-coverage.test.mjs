// Every opcode a shipped example authors must be defined by the extension the
// host it runs on will load.
//
// This is the conformance gate approached from the other side. stc12-conformance
// asks "does each copy define everything the emitter CAN emit"; this asks "does
// each copy define everything the gallery actually DOES emit". The second is the
// one a learner meets, and it is the one that was silently false: on 2026-08-22
// examples/79-a2-sampler used five verbs the bundled extension did not define,
// and nothing anywhere said so.
//
// Nothing says so at runtime either, which is why a static gate is needed.
// scratch-vm pushes a block as an operation only if its opcode has a registered
// function (engine/execute.js), so an undefined opcode is a silent no-op — and an
// undefined HAT is worse, because getIsHat() is false and the script never starts.
// scratch-gui catches the unknown-block throw and logs "the workspace is likely
// incomplete". The project loads, animates, and quietly does less than it says.
// See test/STC12-CONFORMANCE-FINDING.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';
import { snapshots, loadExtension, blocksByOpcode } from './helpers/downstream.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = resolve(here, '..', 'examples');

/** Which extension slugs does this gate know how to check? */
const SLUGS = ['stc12', 'ledcube'];

/** Compile every shipped example once; map slug -> opcode -> [example ids]. */
function authoredOpcodes () {
    const byslug = Object.fromEntries(SLUGS.map((s) => [s, new Map()]));
    let compiled = 0;
    for (const id of readdirSync(EXAMPLES).sort()) {
        const program = join(EXAMPLES, id, 'program.bw');
        if (!existsSync(program)) continue;
        let project;
        try {
            project = new SB3Creator().parse(readFileSync(program, 'utf8'));
        } catch {
            continue;   // parseability is example-corpus-contract's gate, not this one
        }
        compiled++;
        for (const target of project.targets || []) {
            for (const block of Object.values(target.blocks || {})) {
                const opcode = block && block.opcode;
                if (typeof opcode !== 'string') continue;
                for (const slug of SLUGS) {
                    if (!opcode.startsWith(`${slug}_`)) continue;
                    const bare = opcode.slice(slug.length + 1);
                    if (!byslug[slug].has(bare)) byslug[slug].set(bare, []);
                    byslug[slug].get(bare).push(id);
                }
            }
        }
    }
    return { byslug, compiled };
}

const { byslug: AUTHORED, compiled: COMPILED } = authoredOpcodes();

// The instrument first. If the corpus walk compiles nothing, or the gallery
// stops using these extensions at all, every assertion below passes vacuously.
test('the example corpus actually yields extension opcodes', () => {
    // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
    // COMPILED >= 100 -> observed 280.
    assert.ok(COMPILED >= 100,
        `only ${COMPILED} examples compiled — the corpus walk is broken and the coverage ` +
        `assertions below are vacuous`);
    // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
    // AUTHORED.stc12.size >= 10 -> observed 14.
    assert.ok(AUTHORED.stc12.size >= 10,
        `only ${AUTHORED.stc12.size} distinct stc12 opcodes found across ${COMPILED} examples — ` +
        `expected the hardware gallery to use many more; the walk is not seeing block opcodes`);
});

const slugOf = (name) => (name.includes('ledcube') ? 'ledcube' : name.includes('stc12live') ? null : 'stc12');

// ---- the canonical in-repo copy: no exemptions ------------------------------

for (const slug of SLUGS) {
    test(`reference/extensions/${slug}.js defines every opcode the gallery authors`, () => {
        const info = loadExtension(readFileSync(resolve(here, `../reference/extensions/${slug}.js`), 'utf8'), slug);
        const defined = blocksByOpcode(info);
        const undef = [...AUTHORED[slug].keys()].filter((op) => !defined[op]).sort();
        assert.deepStrictEqual(undef, [],
            undef.map((op) => `  ${slug}_${op} — authored by ${AUTHORED[slug].get(op).join(', ')}`).join('\n'));
    });
}

// ---- the vendored downstream copies -----------------------------------------

for (const snap of snapshots()) {
    const slug = slugOf(snap.name);
    if (!slug) continue;   // stc12live has no emitter and no authored opcodes

    test(`${snap.name}: every example's opcodes resolve, or are a recorded gap`, () => {
        const defined = blocksByOpcode(loadExtension(snap.inner, snap.name));
        const recorded = new Set(snap.entry.expectedMissing || []);
        const undef = [...AUTHORED[slug].keys()].filter((op) => !defined[op]).sort();

        // Every undefined opcode must already be a recorded gap. Because
        // expectedMissing is asserted EXACTLY by stc12-conformance, this cannot be
        // widened quietly: adding an entry here to silence this test makes that
        // test fail unless the snapshot really is missing it.
        const surprises = undef.filter((op) => !recorded.has(op));
        assert.deepStrictEqual(surprises, [],
            `${snap.name} (${snap.source.repo}:${snap.source.path}) does not define opcodes that ` +
            `shipped examples author, and MANIFEST.json does not record them:\n` +
            surprises.map((op) => `  ${slug}_${op} — authored by ${AUTHORED[slug].get(op).join(', ')}`).join('\n') +
            `\nThese are silent no-ops in the VM; an undefined HAT never starts its script at all.`);

        // The affected examples are named rather than counted, so the cost of a
        // recorded gap stays visible while it is open instead of becoming a number.
        const affected = [...new Set(undef.flatMap((op) => AUTHORED[slug].get(op)))].sort();
        if (affected.length) {
            assert.ok(snap.entry.pendingFix,
                `${snap.name}: ${affected.length} shipped example(s) are degraded by the recorded ` +
                `gap (${affected.join(', ')}) and there is no pendingFix naming the fix`);
        }
    });
}

// ---- the specific example this whole investigation came from -----------------

test('examples/79-a2-sampler authors exactly the A2 board verbs, against the canonical copy', () => {
    const project = new SB3Creator().parse(
        readFileSync(join(EXAMPLES, '79-a2-sampler', 'program.bw'), 'utf8'));
    const used = new Set();
    for (const target of project.targets || []) {
        for (const block of Object.values(target.blocks || {})) {
            if (block?.opcode?.startsWith('stc12_')) used.add(block.opcode);
        }
    }
    // Pinned deliberately: this example is the reason the gap was visible at all,
    // and if it ever stops using the KEYPAD4X4/SEVENSEG8 verbs then the
    // corpus has lost its sampler coverage of them and someone should notice.
    // LEDBANK8 is intentionally exercised by example 82 instead: it cannot
    // hold an independent pattern while the A2 display decoder is scanning.
    assert.deepStrictEqual([...used].sort(), [
        'stc12_keypad', 'stc12_seg_clear', 'stc12_seg_shownum', 'stc12_whenkey'
    ], 'the A2 sampler is the corpus\'s only user of the board-peripheral verbs');

    const info = loadExtension(readFileSync(resolve(here, '../reference/extensions/stc12.js'), 'utf8'), 'reference');
    const defined = blocksByOpcode(info);
    for (const opcode of used) {
        const block = defined[opcode.slice('stc12_'.length)];
        assert.ok(block, `${opcode} undefined in the canonical copy`);
    }
    // The hat in particular: a HAT that is defined as a COMMAND would load and
    // never fire, which looks identical to the bug this gate exists for.
    assert.strictEqual(defined.whenkey.blockType, 'hat',
        'stc12_whenkey must be a HAT — as a command it would load and never start its script');
});
