/**
 * A generator may not silently revert a repair somebody landed by hand.
 *
 * WHAT HAPPENED
 * -------------
 * Four scripts in scripts/ are named as if they regenerate the shipped
 * pure-circuit corpus. They do not, and running one is destructive:
 *
 *   - commit 0231d74 ("AUDIT-L2: all 8 netlist errors fixed") repaired seven
 *     circuit files BY HAND, adding 91 wires with `wire_fix_*` ids — the 555's
 *     threshold to its timing capacitor, the decade counter's q0..q9 into the
 *     LED chains, an LM358 wired as an actual oscillator. The generators were
 *     never taught to emit any of it.
 *   - the generators' own source has drifted from what ships: the shipped
 *     pc05-npn-switch has no series switch and its LED reads 0.2916, while the
 *     generator builds one that reads 0.0000.
 *
 * So `node scripts/gen-bausatz-canon.mjs` overwrites pc81 with a bench whose
 * timing capacitor floats on both leads, and nothing goes red — the flat twin
 * and the partition manifest are regenerated from the same broken source, so
 * they agree with it.
 *
 * NOT CAUSED BY THE ENGINE-SURFACE FIX, and that was measured rather than
 * assumed. Running the OLD generator (86a5bab, the stale three-key injection)
 * and the NEW one against the same pinned siblings in a scratch tree gives
 * BYTE-IDENTICAL output for all eight of regen-pure-circuits' examples. The two
 * bausatz examples DO differ, and the difference is an improvement: with
 * `getDevice` injected, decade_counter's terminals come out as the full
 * [clk,rst,en,q0..q9,co] instead of the `["a","b"]` stub — which is precisely
 * the defect 0231d74 repaired downstream, now fixed at source.
 *
 * WHAT THIS FILE CHECKS
 *   1. every generator that writes a circuit.json calls the guard first;
 *   2. the repair inventory is what it was measured to be, and may only
 *      SHRINK — a file drops off this list when the generator learns to emit
 *      its wiring, which is the actual fix;
 *   3. MUTATION: the guard really refuses. Given a file with a repair wire it
 *      throws and names the count; given one without, it returns; and `force`
 *      overrides. A guard that cannot fail is not a guard.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { handRepairs, refuseToRevertRepairs } from '../scripts/lib/generator-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES = join(ROOT, 'examples');

/**
 * Scripts that write `examples/<name>/circuit.json`. Grep-derived rather than
 * hand-listed, so a fifth generator cannot join without joining this gate.
 */
const GENERATORS = [
    'regen-pure-circuits.mjs',
    'gen-bausatz-canon.mjs',
    'gen-german-canon.mjs',
    'gen-pure-batch2.mjs',
];

/**
 * MEASURED 2026-08-29 against the shipped corpus. Counts may only go DOWN:
 * a file leaves this table when the generator emits its wiring itself.
 * Raising a number is not a way to land a regression.
 */
const REPAIRED = new Map([
    ['pc81-led-lauflicht', 15],
    ['pc82-mini-roulette', 17],
    ['pc83-gluecksrad', 13],
    ['pc84-led-herz', 17],
    ['pc85-led-lampe-puls', 12],
    ['pc86-led-sanduhr', 12],
    ['pc88-lichtorgel', 5],
]);

describe('generators cannot silently revert a hand repair', () => {
    test('every circuit-writing generator calls the guard before writing', () => {
        const offenders = [];
        for (const g of GENERATORS) {
            const p = join(ROOT, 'scripts', g);
            assert.ok(existsSync(p), `${g} is listed here but does not exist — update the list`);
            const src = readFileSync(p, 'utf8');
            if (!/writeFileSync\([^)]*'circuit\.json'/.test(src)) continue;  // no longer writes one
            if (!src.includes('refuseToRevertRepairs(')) offenders.push(g);
        }
        assert.deepEqual(offenders, [],
            `${offenders.length} generator(s) write a circuit.json without calling ` +
            'refuseToRevertRepairs() first. Commit 0231d74 repaired seven of these ' +
            'files by hand and no generator emits that wiring; writing over them is ' +
            'silent, because the flat twin and the partition manifest regenerate from ' +
            'the same source and agree with it.');
    });

    test('the scanner is not vacuous — it finds the write it is looking for', () => {
        const writers = GENERATORS.filter((g) =>
            /writeFileSync\([^)]*'circuit\.json'/.test(readFileSync(join(ROOT, 'scripts', g), 'utf8')));
        assert.equal(writers.length, GENERATORS.length,
            `only ${writers.length} of ${GENERATORS.length} listed generators still write a ` +
            'circuit.json — if one legitimately stopped, remove it from GENERATORS');
    });

    test('the repair inventory matches the corpus exactly, and may only shrink', () => {
        for (const [name, count] of REPAIRED) {
            const p = join(EXAMPLES, name, 'circuit.json');
            assert.ok(existsSync(p), `${name} is in REPAIRED but has no circuit.json`);
            const actual = handRepairs(p).length;
            assert.ok(actual <= count,
                `${name} now has ${actual} hand-added wires, up from ${count}. A repair ` +
                'made by hand is a generator that has not been taught its job — raise the ' +
                'generator, not this number.');
            assert.equal(actual, count,
                `${name} is down to ${actual} hand-added wires from ${count} — good news. ` +
                'Lower the count here (or delete the entry at 0, which means the generator ' +
                'now emits that wiring itself), or this table stops describing the repo.');
        }
    });

    test('no unlisted example carries hand repairs', () => {
        const unlisted = [];
        for (const dir of readdirSync(EXAMPLES, { withFileTypes: true })) {
            if (!dir.isDirectory() || REPAIRED.has(dir.name)) continue;
            const p = join(EXAMPLES, dir.name, 'circuit.json');
            const n = handRepairs(p).length;
            if (n) unlisted.push(`${dir.name} (${n})`);
        }
        assert.deepEqual(unlisted.sort(), [],
            'a circuit carries hand-added wires that this table does not know about — ' +
            'add it (with its count and the reason the generator cannot emit it yet), ' +
            'so the guard above protects it too');
    });
});

describe('MUTATION: the guard actually refuses', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'bw-genguard-'));

    const write = (name, wires) => {
        const p = join(scratch, name);
        writeFileSync(p, JSON.stringify({ parts: [], wires }));
        return p;
    };

    test('a file with a repair wire is refused, and the message names the count', () => {
        const p = write('repaired.json', [
            { id: 'w_1', from: 'a', to: 'b' },
            { id: 'wire_fix_1004', from: 'c', to: 'd' },
            { id: 'wire_fix_1005', from: 'e', to: 'f' },
        ]);
        assert.equal(handRepairs(p).length, 2);
        assert.throws(() => refuseToRevertRepairs(p), (e) => {
            assert.match(e.message, /2 hand-added wire/);
            assert.match(e.message, /wire_fix_1004/);
            assert.match(e.message, /0231d74/, 'the message must name the repair commit');
            return true;
        });
    });

    test('a file without repair wires is written without complaint', () => {
        const p = write('clean.json', [{ id: 'w_1', from: 'a', to: 'b' }]);
        assert.deepEqual(handRepairs(p), []);
        assert.doesNotThrow(() => refuseToRevertRepairs(p));
    });

    test('a file that does not exist yet is not a refusal', () => {
        assert.doesNotThrow(() => refuseToRevertRepairs(join(scratch, 'nope.json')));
        assert.deepEqual(handRepairs(join(scratch, 'nope.json')), []);
    });

    test('malformed JSON is not a refusal, and not a crash either', () => {
        const p = join(scratch, 'bad.json');
        writeFileSync(p, '{not json');
        assert.deepEqual(handRepairs(p), []);
        assert.doesNotThrow(() => refuseToRevertRepairs(p));
    });

    test('--force overrides deliberately', () => {
        const p = write('forced.json', [{ id: 'wire_fix_9', from: 'a', to: 'b' }]);
        assert.throws(() => refuseToRevertRepairs(p));
        assert.doesNotThrow(() => refuseToRevertRepairs(p, { force: true }));
    });

    test('the marker is a prefix, so a later repair inherits the protection', () => {
        const p = write('future.json', [{ id: 'wire_fix_2099_someone_elses_pass', from: 'a', to: 'b' }]);
        assert.equal(handRepairs(p).length, 1);
        assert.throws(() => refuseToRevertRepairs(p));
    });
});
