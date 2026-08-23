/**
 * An example's declared `kind` must agree with what its files actually contain.
 *
 * THE DEFECT CLASS
 * ----------------
 * `kind` is a claim about the example, and nothing checked it against the
 * example. It has been wrong in both directions, and neither showed up as a
 * failure anywhere:
 *
 *   kind "program" over a bench with no program — two retro benches
 *   (0e4f669) were enrolled as programs and read as "no blocks", which is
 *   indistinguishable from a program that compiles to nothing.
 *
 *   kind "circuit" over a bench with a real program — 33-inductive-no-flyback
 *   declared "circuit" while shipping a DEVICE/CLOCK/PIN program with a
 *   FOREVER loop that parses to the same six blocks as 01-blink. It was also
 *   the only kind:"circuit" entry in the catalog carrying `devices`, `benches`,
 *   `tier` and `authored` — four independent metadata fields disagreeing with
 *   the fifth.
 *
 * THE DISCRIMINATOR
 * -----------------
 * Counting lines does not work: 113 circuit-only examples ship a program.bw
 * holding one comment ("# Pure circuit — no MCU"), and four retro benches ship
 * declaration-only files (DEVICE/MAP/CHIP) that describe hardware and run
 * nothing. Both are correct and both are non-empty.
 *
 * So the discriminator is the REAL PARSER: parse program.bw and count the
 * blocks it produces. A placeholder and a declaration-only bench both produce
 * ZERO; 33-inductive-no-flyback produced six, exactly as 01-blink does. That
 * is the question "does this example have a program" asked of the compiler
 * that would have to run it, rather than of the file's shape.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));

/** Blocks the compiler builds from this program, or a reason it cannot say. */
function blockCount(dir) {
    const path = join(EXAMPLES, dir, 'program.bw');
    if (!existsSync(path)) return { ok: true, blocks: 0, absent: true };
    let project;
    try { project = new SB3Creator().parse(readFileSync(path, 'utf8')); }
    catch (e) { return { ok: false, reason: `program.bw does not parse: ${e.message.split('\n')[0]}` }; }
    let blocks = 0;
    for (const target of project.targets || [])
        for (const [, b] of Object.entries(target.blocks || {}))
            if (b && typeof b === 'object' && !Array.isArray(b) && b.opcode) blocks++;
    return { ok: true, blocks, absent: false };
}

/**
 * RATCHET: entries whose kind is knowingly at odds with their content, each
 * with the verdict. May only SHRINK. Empty — 33-inductive-no-flyback was
 * corrected to "program" rather than recorded here.
 */
const KNOWN_KIND_MISMATCH = new Map([]);

describe('example kind agrees with example content', () => {
    const counts = new Map(index.map(e => [e.id, blockCount(e.id)]));

    test('every program.bw in the catalog parses', () => {
        const broken = [...counts].filter(([, c]) => !c.ok).map(([id, c]) => `${id}: ${c.reason}`);
        assert.deepEqual(broken, [], 'a program that will not parse cannot be classified');
    });

    test('the instrument is measuring a real catalog', () => {
        // Floors: without these the two assertions below hold vacuously over
        // an empty or truncated catalog.
        assert.ok(index.length >= 259, `catalog shrank to ${index.length}`);
        const withBlocks = [...counts.values()].filter(c => c.ok && c.blocks > 0).length;
        assert.ok(withBlocks >= 100, `only ${withBlocks} examples parse to any blocks — the parser call is wrong`);
        const without = [...counts.values()].filter(c => c.ok && c.blocks === 0).length;
        assert.ok(without >= 100, `only ${without} examples parse to zero blocks — the placeholder convention is gone`);
    });

    test('kind "circuit" means the example runs no program', () => {
        const wrong = [];
        for (const entry of index) {
            if (entry.kind !== 'circuit') continue;
            const c = counts.get(entry.id);
            if (!c.ok || c.blocks === 0 || KNOWN_KIND_MISMATCH.has(entry.id)) continue;
            wrong.push(`${entry.id}: kind "circuit" but program.bw parses to ${c.blocks} blocks`);
        }
        assert.deepEqual(wrong.sort(), [],
            'These are enrolled as circuit-only and ship a running program. Either the kind is '
            + 'wrong or the program is stray; do not silence it here.');
    });

    test('kind "program" and "full" mean the example has a program', () => {
        const wrong = [];
        for (const entry of index) {
            if (entry.kind === 'circuit') continue;
            const c = counts.get(entry.id);
            if (!c.ok || KNOWN_KIND_MISMATCH.has(entry.id)) continue;
            if (c.absent) wrong.push(`${entry.id}: kind "${entry.kind}" but there is no program.bw`);
            else if (c.blocks === 0)
                wrong.push(`${entry.id}: kind "${entry.kind}" but program.bw parses to 0 blocks — it reads as a circuit-only placeholder`);
        }
        assert.deepEqual(wrong.sort(), [],
            'These are enrolled as programs and have nothing to run. That is how two retro '
            + 'benches shipped reading as "no blocks" (0e4f669).');
    });

    test('program-only metadata does not appear on a circuit-only entry', () => {
        // devices / benches / authored describe a program being retargeted to
        // hardware. On a kind:"circuit" entry they are four fields disagreeing
        // with the fifth, which is precisely how 33-inductive-no-flyback read.
        const wrong = [];
        for (const entry of index) {
            if (entry.kind !== 'circuit' || KNOWN_KIND_MISMATCH.has(entry.id)) continue;
            const carried = ['devices', 'benches', 'authored']
                .filter(k => entry[k] && (Array.isArray(entry[k]) ? entry[k].length : true));
            if (carried.length) wrong.push(`${entry.id}: kind "circuit" but carries ${carried.join(', ')}`);
        }
        assert.deepEqual(wrong.sort(), [], 'circuit-only examples are not retargeted to devices');
    });

    test('KNOWN_KIND_MISMATCH carries nothing that no longer reproduces', () => {
        const ids = new Set(index.map(e => e.id));
        const stale = [...KNOWN_KIND_MISMATCH.keys()].filter(id => !ids.has(id));
        assert.deepEqual(stale, [], 'RATCHET: remove entries whose example is gone.');
    });
});
