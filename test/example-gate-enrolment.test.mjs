/**
 * Which gates enrol each example — recorded, so a metadata change shows its
 * effect on COVERAGE instead of announcing it later as a red build.
 *
 * WHY THIS EXISTS
 * ---------------
 * 33-inductive-no-flyback was enrolled as `kind:"circuit"` while shipping a real
 * program. Correcting the kind was right; what neither of the two sessions
 * working on it noticed was that the correction ALSO changed which gates the
 * example was subject to. `retarget-gallery` enrols exactly `kind:"program"`,
 * so flipping the kind pulled in a gate that demands `devices` equal the
 * retarget dry-run — and that entry's `devices` list had been wrong the whole
 * time, unchecked precisely because a circuit-only entry is outside that gate.
 * The red build was the first anyone heard of it, and the first repair attempt
 * satisfied the newly-applicable gate by generating nine benches, turning a
 * deliberately single-board example into a retargetable one.
 *
 * `scripts/gen-device-benches.mjs` made that worse in a way worth naming: its
 * `batch` step skips any entry with `devices.length < 2` and reads that list
 * from index.json. The list that was wrong is the same list the generator
 * consults, so it reported "generated 0" and read as a successful no-op.
 *
 * The lesson generalises past `kind`: metadata that is merely UNCHECKED becomes
 * LOAD-BEARING the moment a field changes, and nothing made that transition
 * visible.
 *
 * WHAT THIS IS AND IS NOT
 * -----------------------
 * It is a committed map from example to the gates that enrol it, recomputed on
 * every run from the same predicates those gates use, and compared against the
 * fixture. Change an example's kind and the fixture stops matching, with the
 * gained and lost gates named. Regenerating is deliberate:
 *
 *     node scripts/gen-example-enrolment.mjs --write
 *
 * It is NOT a claim that these are all the tests touching the corpus — 57 test
 * files read `examples/`. It covers the ones whose enrolment is a FUNCTION OF
 * METADATA, which is the set where a field change silently moves coverage. A
 * suite that simply reads every example is listed in CORPUS_WIDE, and one that
 * reads the corpus without filtering per example is listed in NOT_PER_EXAMPLE
 * with the reason — so a new metadata-filtering gate cannot be added without
 * appearing here.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildEnrolment, ENROLMENT, NOT_PER_EXAMPLE, CORPUS_WIDE }
    from '../scripts/lib/example-enrolment.mjs';

const ROOT = join(import.meta.dirname, '..');
const EXAMPLES = join(ROOT, 'examples');
const FIXTURE = join(ROOT, 'test', 'fixtures', 'example-enrolment.json');

describe('gate enrolment per example is recorded, not discovered', () => {
    const computed = buildEnrolment(EXAMPLES);
    const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));

    test('the map covers the whole catalog and no example falls through every gate', () => {
        // Floors: an empty map would make the comparison below trivially true.
        assert.ok(Object.keys(computed.map).length >= 259,
            `only ${Object.keys(computed.map).length} examples enrolled — the builder is broken`);
        assert.ok(ENROLMENT.length >= 10, `only ${ENROLMENT.length} predicates declared`);
        const orphans = Object.entries(computed.map)
            .filter(([, gates]) => gates.length === 0).map(([id]) => id);
        assert.deepEqual(orphans.sort(), [],
            'These examples ship and no metadata-filtered gate enrols them.');
    });

    test('every test file that reads the catalog is accounted for', () => {
        // A new gate that filters examples by metadata must appear in
        // ENROLMENT, or this fails. That is the whole point: coverage cannot
        // change without the map changing with it.
        const readers = readdirSync(join(ROOT, 'test'))
            .filter(f => f.endsWith('.test.mjs'))
            .filter(f => readFileSync(join(ROOT, 'test', f), 'utf8').includes('index.json'))
            .map(f => f.replace(/\.test\.mjs$/, ''));
        assert.ok(readers.length >= 10, `only ${readers.length} catalog readers found — the scan is broken`);
        const declared = new Set([...ENROLMENT.map(e => e.gate), ...NOT_PER_EXAMPLE.keys(), ...CORPUS_WIDE]);
        const unaccounted = readers.filter(r => !declared.has(r));
        assert.deepEqual(unaccounted.sort(), [],
            'A test file reads examples/index.json and is in neither ENROLMENT nor NOT_PER_EXAMPLE. '
            + 'Declare how it enrols examples, or say why it does not filter per example.');
    });

    test('every declared predicate actually selects something', () => {
        // A predicate that matches nothing is a gate that quietly stopped
        // applying — the same failure mode corpusFloor() guards inside the
        // individual suites, applied to the map itself.
        const empty = ENROLMENT.filter(e => computed.counts[e.gate] === 0).map(e => e.gate);
        assert.deepEqual(empty, [],
            'These predicates select zero examples. Either the gate no longer enrols anything '
            + '(a coverage hole) or the predicate has rotted.');
    });

    test('the recorded map still matches what the predicates compute', () => {
        const changes = [];
        const ids = new Set([...Object.keys(fixture.map), ...Object.keys(computed.map)]);
        for (const id of [...ids].sort()) {
            const was = fixture.map[id], now = computed.map[id];
            if (!was) { changes.push(`${id}: NEW example, enrolled by [${now.join(', ')}]`); continue; }
            if (!now) { changes.push(`${id}: GONE from the catalog (was [${was.join(', ')}])`); continue; }
            const gained = now.filter(g => !was.includes(g));
            const lost = was.filter(g => !now.includes(g));
            if (gained.length || lost.length)
                changes.push(`${id}: ${gained.length ? '+[' + gained.join(', ') + '] ' : ''}`
                    + `${lost.length ? '-[' + lost.join(', ') + ']' : ''}`.trim());
        }
        assert.deepEqual(changes, [],
            'The gates that enrol these examples changed. That is a change in COVERAGE, so it is '
            + 'reported rather than absorbed: check each gained gate now passes and each lost one '
            + 'was meant to go, then regenerate with '
            + '`node scripts/gen-example-enrolment.mjs --write`.');
    });

    test('the fixture records which engine and catalog it was measured against', () => {
        assert.ok(fixture.measuredOn, 'fixture must carry measuredOn');
        assert.equal(fixture.examples, Object.keys(computed.map).length,
            'fixture example count disagrees with the catalog');
    });
});
