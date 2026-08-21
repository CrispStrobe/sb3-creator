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
import {existsSync, globSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

import {DEVPART} from '../scripts/lib/devpart.mjs';

const ROOT = join(import.meta.dirname, '..');
const EXAMPLES = join(ROOT, 'examples');
const CUI = process.env.BW_CIRCUIT_UI || join(ROOT, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(ROOT, '..', 'bw-board');
const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const circuitFiles = globSync('examples/*/circuit*.json', {cwd: ROOT}).sort();
const generatedFiles = circuitFiles.filter(file => /\/circuit\.[\w-]+\.json$/.test(file));

const available = existsSync(join(CUI, 'src', 'model', 'circuit.js'))
    && existsSync(join(BWB, 'src', 'index.js'));

describe('example corpus: catalog and bench inventory agree exactly', () => {
    test(`catalog covers ${index.length} examples and all ${generatedFiles.length} generated benches`, () => {
        // Floors make an accidentally empty/partial checkout fail loudly rather
        // than proving set equality over two empty sets.
        assert.ok(index.length >= 259, `catalog shrank unexpectedly to ${index.length}`);
        assert.ok(circuitFiles.length >= 1034, `circuit corpus shrank unexpectedly to ${circuitFiles.length}`);
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
    {skip: available ? false : 'needs bw-circuit-ui/bw-board checkouts'}, () => {
        let Circuit;

        test('engine and all part sidecars load', async () => {
            const {setEngine} = await import(join(CUI, 'src/engine.js'));
            const eng = await import(join(BWB, 'src/index.js'));
            (await import(join(BWB, 'src/register-all.js'))).registerAllDevices();
            setEngine({
                BoardImpl: eng.BoardImpl,
                inferNetlist: eng.inferNetlist,
                checkWiring: eng.checkWiring,
                hasDevice: eng.hasDevice
            });
            const {registerSidecar} = await import(join(CUI, 'src/model/parts-registry.js'));
            for (const file of readdirSync(join(CUI, 'src/parts-data'))) {
                if (!file.endsWith('.json')) continue;
                try {
                    const sidecar = JSON.parse(readFileSync(join(CUI, 'src/parts-data', file), 'utf8'));
                    if (sidecar.kind) registerSidecar(sidecar);
                } catch { /* a malformed sidecar is covered by bw-circuit-ui */ }
            }
            ({Circuit} = await import(join(CUI, 'src/model/circuit.js')));
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
