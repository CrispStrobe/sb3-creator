/**
 * Every claim an index entry makes about the world must hold.
 *
 * THE DEFECT CLASS
 * ----------------
 * `kind` was the first metadata field found lying about its example
 * (test/example-kind-matches-content.test.mjs). It was not the only one. An
 * index entry declares files, devices, benches, an authored chip and a ledger
 * of refusals, and until this gate nothing held most of those against the
 * corpus they describe:
 *
 *   36 entries declared a `thumbnail`. Not one of the files existed, none ever
 *   had, and no code in sb3-creator, bw-board, bw-circuit-ui or lite's app
 *   reads the field — two generator scripts wrote it and nothing consumed it.
 *   05-counter's even pointed into `05-counter-7seg/`, a directory that does
 *   not exist. gallery.test.mjs already asserts "every index entry points to
 *   files that exist" and missed all 36, because it walks `entry.files` and
 *   `thumbnail` is not in there.
 *
 *   8 `refusals` entries named a device the catalog OFFERS. 46-port-overcurrent
 *   said arduino-uno "has more digital outputs than its convention offers" while
 *   listing arduino-uno in `devices` and shipping it a bench; 54-motor-driver
 *   said "motor blocks are stubs on this core" for three devices it ships;
 *   07-buzzer-siren refused its OWN AUTHORED CHIP, for which retarget is the
 *   identity. All eight were measured against `retargetPseudocode` and all eight
 *   dry-runs succeed. The refusal texts were true once and nothing re-read them.
 *
 * WHAT IT CHECKS
 * --------------
 * The denominator is stated, because a sweep with an unstated denominator is
 * indistinguishable from a sweep that only looked where it expected to find
 * something. Across 274 entries the index uses 26 distinct fields; this gate
 * covers every one that makes a checkable claim about the filesystem or about
 * the compiler's own answers, and the fields it does NOT check are named below.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const dirs = new Set(readdirSync(EXAMPLES).filter(d => statSync(join(EXAMPLES, d)).isDirectory()));

/**
 * A self-contained board with no breadboard circuit. Spelled exactly as
 * gallery.test.mjs spells it — ten micro:bit and SPIKE examples are device-only
 * by their authored chip and never set the flag, so testing the flag alone
 * reports ten false positives.
 */
const deviceOnly = (entry) =>
    entry.deviceOnly === true || entry.authored === 'microbit' || entry.authored === 'spike';

/**
 * Index fields this gate does NOT check, and why. Naming them is the point:
 * an unlisted field is an unchecked claim nobody has decided about.
 *
 *   id, title.en, title.de, category, difficulty, kind  — shape-checked by
 *       gallery.test.mjs; `kind` is held against content by
 *       example-kind-matches-content.test.mjs.
 *   devices             — held against the retarget dry-run by
 *                         retarget-gallery.test.mjs.
 *   expectedWarnings    — held against real compiler warnings by gallery.test.mjs.
 *   deviceOnly          — a declaration about the example's nature, not about a
 *                         file; consumed here to excuse a missing circuit.
 *   device              — free-text prose on 17 entries, read by nothing.
 */
const UNCHECKED_HERE = new Set([
    // pcbExpectedFindings: the DRC-verdict pin for a shipped teaching
    // board; checked exactly (gain AND loss fail) by bw-circuit-ui's
    // test/board-corpus.test.js gallery sweep, which imports the board
    // and compares runPcbDrc's verdict against this declaration.
    'pcbExpectedFindings',
    'id', 'title', 'category', 'difficulty', 'kind', 'devices',
    'expectedWarnings', 'deviceOnly', 'device',
]);

/** Fields this gate DOES hold against the world. */
const CHECKED_HERE = new Set(['files', 'thumbnail', 'benches', 'authored', 'refusals', 'transformRefused', 'tier']);

describe('index metadata agrees with the files and the compiler', () => {
    test('the denominator: every field the index uses is either checked here or named as not', () => {
        const seen = new Set();
        for (const entry of index) for (const k of Object.keys(entry)) seen.add(k);
        // Floors: an empty or truncated catalog makes everything below vacuous.
        assert.ok(index.length >= 259, `catalog shrank to ${index.length}`);
        assert.ok(seen.size >= 14, `only ${seen.size} distinct index fields — the scan is broken`);
        const unaccounted = [...seen].filter(k => !CHECKED_HERE.has(k) && !UNCHECKED_HERE.has(k));
        assert.deepEqual(unaccounted.sort(), [],
            'A new index field is a new claim. Either hold it against the world in this gate, '
            + 'or add it to UNCHECKED_HERE with the reason and the gate that does.');
    });

    test('every path an entry names exists on disk', () => {
        const missing = [];
        for (const entry of index) {
            for (const [key, rel] of Object.entries(entry.files || {}))
                if (!existsSync(join(EXAMPLES, rel))) missing.push(`${entry.id}: files.${key} -> ${rel}`);
            // thumbnail sits OUTSIDE entry.files, which is exactly why the
            // existing "every index entry points to files that exist" check
            // walked past 36 broken ones.
            if (entry.thumbnail && !existsSync(join(EXAMPLES, entry.thumbnail)))
                missing.push(`${entry.id}: thumbnail -> ${entry.thumbnail}`);
            for (const [device, rel] of Object.entries(entry.benches || {}))
                if (!existsSync(join(EXAMPLES, rel))) missing.push(`${entry.id}: benches.${device} -> ${rel}`);
            if (!dirs.has(entry.id)) missing.push(`${entry.id}: no directory`);
        }
        assert.deepEqual(missing.sort(), [], 'index entries naming files that do not exist');
    });

    test('the catalog and the directory tree describe the same set of examples', () => {
        const ids = new Set(index.map(e => e.id));
        // AUDIT is the auditors' workspace, not an example.
        const orphans = [...dirs].filter(d => d !== 'AUDIT' && !ids.has(d));
        assert.deepEqual(orphans.sort(), [], 'directories with no index entry');
    });

    test('every offered device has something to load, and every bench is offered', () => {
        const problems = [];
        for (const entry of index) {
            const authoredCircuit = existsSync(join(EXAMPLES, entry.id, 'circuit.json'));
            for (const [device, rel] of Object.entries(entry.benches || {})) {
                if (!rel.startsWith(`${entry.id}/`)) problems.push(`${entry.id}: ${device} bench escapes its directory (${rel})`);
                if (!(entry.devices || []).includes(device)) problems.push(`${entry.id}: bench for ${device}, which devices does not offer`);
            }
            for (const device of entry.devices || []) {
                if ((entry.benches || {})[device]) continue;
                // The AUTHORED device loads circuit.json itself — a generated
                // bench for it would never be requested (gen-device-benches
                // skips exactly this case).
                if (device === entry.authored && authoredCircuit) continue;
                // A device-only example is a self-contained board with no
                // breadboard circuit at all. The predicate is gallery.test.mjs's,
                // deliberately spelled the same way: a micro:bit or SPIKE example
                // is device-only by its authored chip and does not carry the flag.
                if (deviceOnly(entry)) continue;
                problems.push(`${entry.id}: offers ${device} with neither a bench nor an authored circuit`);
            }
            if (entry.authored && !(entry.devices || []).includes(entry.authored)
                && !['microbit', 'spike'].includes(entry.authored))
                problems.push(`${entry.id}: authored ${entry.authored} is not in devices`);
        }
        assert.deepEqual(problems.sort(), [], 'devices, benches and authored disagree');
    });

    test('authored names the chip the program actually declares', () => {
        const wrong = [];
        for (const entry of index) {
            if (!entry.authored) continue;
            const path = join(EXAMPLES, entry.id, 'program.bw');
            if (!existsSync(path)) continue;
            const m = readFileSync(path, 'utf8').match(/^DEVICE\s+([\w-]+)/im);
            if (!m) continue;
            const declared = m[1].toLowerCase().replace(/_/g, '-');
            // These authored values name a FAMILY the DEVICE line spells
            // differently (a micro:bit program says DEVICE MICROBIT, a wired
            // machine says DEVICE EATER6502).
            if (['microbit', 'spike', 'eater6502', 'z80'].includes(entry.authored)) continue;
            if (declared !== entry.authored)
                wrong.push(`${entry.id}: authored=${entry.authored}, program says DEVICE ${declared}`);
        }
        assert.deepEqual(wrong.sort(), [], 'authored disagrees with the program');
    });

    test('a ledgered refusal names a device the catalog does not offer, and the compiler agrees', () => {
        // `refusals` records devices whose RETARGET refuses. `transformRefused`
        // records devices retarget offers but whose CIRCUIT transform refuses,
        // which is why the two expect opposite dry-run answers. Either way the
        // device must not also be offered — a refusal beside a shipped bench is
        // a document contradicting the shipping catalog.
        const problems = [];
        for (const entry of index) {
            const path = join(EXAMPLES, entry.id, 'program.bw');
            const src = existsSync(path) ? readFileSync(path, 'utf8') : null;
            for (const [field, dryRunShouldSucceed] of [['refusals', false], ['transformRefused', true]]) {
                for (const device of Object.keys(entry[field] || {})) {
                    if ((entry.devices || []).includes(device))
                        problems.push(`${entry.id}: ${field} names ${device}, which devices offers`);
                    if ((entry.benches || {})[device])
                        problems.push(`${entry.id}: ${field} names ${device}, which ships a bench`);
                    if (!src) continue;
                    const r = SB3Creator.retargetPseudocode(src, device);
                    if (!!r.ok !== dryRunShouldSucceed)
                        problems.push(`${entry.id}: ${field} names ${device}, but the retarget dry-run `
                            + `${r.ok ? 'SUCCEEDS' : 'refuses'} and ${field} means it should `
                            + `${dryRunShouldSucceed ? 'succeed' : 'refuse'}`);
                }
            }
        }
        assert.deepEqual(problems.sort(), [],
            'A refusal is a claim about what this example cannot do. Re-measure it or delete it; '
            + 'the eight found in the 2026-08-23 sweep had all become false.');
    });

    test('tier is a value something recognises', () => {
        const bad = index.filter(e => e.tier && e.tier !== 'arch').map(e => `${e.id}: ${e.tier}`);
        assert.deepEqual(bad, [], 'unknown tier value');
    });
});
