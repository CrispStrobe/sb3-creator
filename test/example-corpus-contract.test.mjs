/**
 * Whole-corpus shipping contract.
 *
 * This closes two gaps left by the per-example compiler and bench-invariant
 * suites: the catalog must advertise exactly the benches that actually ship,
 * and every primary/generated circuit must survive the same canonical
 * load-save-load path used by Circuit Designer without silent data loss.
 */
import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, globSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

import {DEVPART} from '../scripts/lib/devpart.mjs';
import {injectEngine, registerSidecars} from '../scripts/lib/engine-surface.mjs';

const ROOT = join(import.meta.dirname, '..');
const EXAMPLES = join(ROOT, 'examples');
const CUI = process.env.BW_CIRCUIT_UI || join(ROOT, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(ROOT, '..', 'bw-board');
const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const circuitFiles = globSync('examples/*/circuit*.json', {cwd: ROOT}).sort();
const generatedFiles = circuitFiles.filter(file => /\/circuit\.[\w-]+\.json$/.test(file));

// Cross-repo guard: skip locally, FAIL in CI. CI checks both siblings out at the
// revisions pinned in test/fixtures/siblings.json, so an absent sibling there means
// the checkout step broke and this gate just went silent — see
// test/CROSS-REPO-GATE-AUDIT.md and test/helpers/siblings.mjs.
const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'the example corpus contract');

describe('example corpus: catalog and bench inventory agree exactly', () => {
    test(`catalog covers ${index.length} examples and all ${generatedFiles.length} generated benches`, () => {
        // Floors make an accidentally empty/partial checkout fail loudly rather
        // than proving set equality over two empty sets.
        assert.ok(index.length >= 259, `catalog shrank unexpectedly to ${index.length}`);
        // MEASURED 2026-08-25: circuitFiles is 2099. The floor was 1034 — set
        // when the corpus was about that size, corrected once in 2026-08 after
        // a vendor added 58 circuits, and never revisited while the corpus
        // doubled. At 1034 it was 49.3 % of actual and HALF THE CORPUS COULD
        // VANISH before it fired, which is how a floor stops being a floor with
        // nobody touching it.
        //
        // 1970 is 93.9 % of 2099, which puts it inside the band its two
        // neighbours in this same assertion already use (259/278 = 93.2 %,
        // 819/870 = 94.1 %). That is the house allowance for a deliberate
        // removal or two, and matching it keeps the three floors here
        // consistent rather than inventing a new policy for one of them.
        // Raise this when the corpus grows; never lower it to make a change fit.
        assert.ok(circuitFiles.length >= 1970, `circuit corpus shrank unexpectedly to ${circuitFiles.length}`);
        assert.ok(generatedFiles.length >= 819, `generated bench corpus shrank unexpectedly to ${generatedFiles.length}`);

        const references = new Map();
        const problems = [];
        for (const entry of index) {
            const benchDevices = Object.keys(entry.benches || {});
            for (const [device, relative] of Object.entries(entry.benches || {})) {
                if (!DEVPART[device]) problems.push(`${entry.id}: no controller-part mapping for ${device}`);
                if (!relative.startsWith(`${entry.id}/`)) {
                    problems.push(`${entry.id}: ${device} bench escapes its example directory (${relative})`);
                }
                references.set(relative, (references.get(relative) || 0) + 1);
                const absolute = join(EXAMPLES, relative);
                if (!existsSync(absolute)) {
                    problems.push(`${entry.id}: advertised ${device} bench is missing (${relative})`);
                    continue;
                }
                const data = JSON.parse(readFileSync(absolute, 'utf8'));
                const controllers = (data.parts || []).filter(part => part.kind === DEVPART[device]);
                if (controllers.length !== 1) {
                    problems.push(`${entry.id}: ${device} bench has ${controllers.length} ${DEVPART[device]} controllers`);
                }
            }

            // A program's authored device uses files.circuit; every additional
            // advertised device must have a generated bench. Device-only
            // micro:bit/SPIKE examples intentionally have neither circuit form.
            if (Array.isArray(entry.devices) && entry.files?.circuit) {
                const expected = new Set(benchDevices);
                if (entry.authored) expected.add(entry.authored);
                assert.deepEqual(new Set(entry.devices), expected,
                    `${entry.id}: devices must equal authored circuit + generated benches`);
            }

            if (entry.files?.circuit && entry.authored && DEVPART[entry.authored]) {
                const primary = JSON.parse(readFileSync(join(EXAMPLES, entry.files.circuit), 'utf8'));
                const controllers = (primary.parts || []).filter(part => part.kind === DEVPART[entry.authored]);
                if (controllers.length !== 1) {
                    problems.push(`${entry.id}: primary circuit has ${controllers.length} ${DEVPART[entry.authored]} controllers`);
                }
            }
        }

        const shipped = new Set(generatedFiles.map(file => file.slice('examples/'.length)));
        const referenced = new Set(references.keys());
        assert.deepEqual(referenced, shipped,
            'every generated bench must be referenced, and every reference must ship');
        assert.deepEqual([...references].filter(([, count]) => count !== 1), [],
            'a generated bench must belong to exactly one catalog entry');
        assert.deepEqual(problems, []);
    });
});

describe('example corpus: canonical Circuit Designer load/save/load',
    { skip: gate.skip }, () => {
        let Circuit;

        test('engine and all part sidecars load', async () => {
            ({Circuit} = await injectEngine({board: BWB, cui: CUI}));
            await registerSidecars(CUI);
        });

        test(`all ${circuitFiles.length} circuits load, preserve data, and reload electrically`, () => {
            const problems = [];
            const originalWarn = console.warn;
            console.warn = () => {};
            try {
                for (const relative of circuitFiles) {
                    const source = JSON.parse(readFileSync(join(ROOT, relative), 'utf8'));
                    let first;
                    try {
                        first = Circuit.fromJSON(source);
                    } catch (error) {
                        problems.push(`${relative}: loader threw ${error.message}`);
                        continue;
                    }
                    if (first.netlistError != null) {
                        problems.push(`${relative}: engine rejected load (${first.netlistError})`);
                        continue;
                    }
                    if (!first.board?.parts?.length) {
                        problems.push(`${relative}: canonical load produced an empty board`);
                        continue;
                    }

                    const once = first.toJSON();
                    if (once.parts.length !== source.parts.length) {
                        problems.push(`${relative}: load lost parts (${source.parts.length} -> ${once.parts.length})`);
                    }
                    if (once.wires.length !== (source.wires || []).length) {
                        problems.push(`${relative}: load lost wires (${(source.wires || []).length} -> ${once.wires.length})`);
                    }
                    for (const part of once.parts) {
                        if (!Number.isFinite(part.x) || !Number.isFinite(part.y)) {
                            problems.push(`${relative}: ${part.id} has non-renderable coordinates`);
                        }
                        if (!Array.isArray(part.terminals)) {
                            problems.push(`${relative}: ${part.id} has no canonical terminal list`);
                        }
                    }

                    const second = Circuit.fromJSON(once);
                    if (second.netlistError != null) {
                        problems.push(`${relative}: engine rejected reload (${second.netlistError})`);
                        continue;
                    }
                    try {
                        assert.deepEqual(second.toJSON(), once);
                    } catch {
                        problems.push(`${relative}: load-save-load is not a fixed point`);
                    }
                }
            } finally {
                console.warn = originalWarn;
            }
            assert.deepEqual(problems, []);
        });
    });
