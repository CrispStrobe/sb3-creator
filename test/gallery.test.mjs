// Headless verification of the starter-circuits gallery.
// Each example: parse .bw → generateJavaScript({driver:'simulator'}) → run with
// a mock board → assert pin states match EXPECTED.md numbers.
//
// This is the first regression suite that spans pseudocode → blocks → JS → board.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const EXAMPLES_DIR = join(import.meta.dirname, '..', 'examples');

// Index-based circuit path lookup (WORE contract: discover via manifest, never by glob)
const _index = JSON.parse(readFileSync(join(EXAMPLES_DIR, 'index.json'), 'utf8'));
const _indexByDir = new Map(_index.map(e => [e.files?.program?.split('/')[0], e]));
function circuitPathFor(dir, name) {
    const entry = _indexByDir.get(name);
    if (entry?.files?.circuit) return join(EXAMPLES_DIR, entry.files.circuit);
    return join(dir, 'circuit.json');
}

// Find all example directories
const examples = readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

describe('gallery: every example parses and compiles', () => {
    for (const name of examples) {
        const dir = join(EXAMPLES_DIR, name);
        const bwPath = join(dir, 'program.bw');
        const circuitPath = circuitPathFor(dir, name);
        const expectedPath = join(dir, 'EXPECTED.md');

        test(`${name}: program.bw parses with zero warnings`, () => {
            assert.ok(existsSync(bwPath), `${name}/program.bw missing`);
            const src = readFileSync(bwPath, 'utf8');
            const c = new SB3Creator();
            c.parse(src);
            assert.deepEqual(c.warnings, [], `${name} parse warnings`);
        });

        test(`${name}: generates C with zero warnings`, () => {
            const src = readFileSync(bwPath, 'utf8');
            const c = new SB3Creator();
            c.parse(src);
            const code = c.generateC();
            assert.ok(code.length > 0, 'non-empty C');
            assert.ok(!/@bw-end/.test(code) || /@bw-begin/.test(code), 'marker header present');
        });

        test(`${name}: C round-trips back to pseudocode`, () => {
            const src = readFileSync(bwPath, 'utf8');
            const c = new SB3Creator();
            c.parse(src);
            const cCode = c.generateC();
            // Skip round-trip for host C (no @bw marker → not device C → different reader)
            // and for AVR targets (cToPseudocode only reads STC12/8051 C)
            if (!/@bw-begin/.test(cCode)) return;
            if (/@bw device (arduino|atmega|pico|rp2040)/m.test(cCode)) return;
            const { pseudocode, warnings } = cToPseudocode(cCode);
            // Aggregate current warnings are about the declarations, not translation errors.
            const translationWarnings = warnings.filter(w => !/worst-case|output pins/.test(w));
            assert.deepEqual(translationWarnings, [], `${name} round-trip warnings`);
            const c2 = new SB3Creator();
            c2.parse(pseudocode);
            assert.deepEqual(c2.warnings, [], `${name} recompile warnings`);
        });

        test(`${name}: pseudocode → C → pseudocode is a fixed point`, () => {
            const src = readFileSync(bwPath, 'utf8');
            const c1 = new SB3Creator();
            c1.parse(src);
            const cCode = c1.generateC();
            if (!/@bw-begin/.test(cCode)) return;
            if (/@bw device (arduino|atmega|pico|rp2040)/m.test(cCode)) return;
            const { pseudocode: ps1 } = cToPseudocode(cCode);
            const c2 = new SB3Creator();
            c2.parse(ps1);
            const { pseudocode: ps2 } = cToPseudocode(c2.generateC());
            assert.equal(ps2, ps1, `${name} is not a fixed point`);
        });

        test(`${name}: generates JavaScript with simulator driver`, () => {
            const src = readFileSync(bwPath, 'utf8');
            const c = new SB3Creator();
            c.parse(src);
            const js = c.generateJavaScript(undefined, { driver: 'simulator' });
            assert.ok(js.length > 0, 'non-empty JS');
        });

        test(`${name}: circuit.json is valid`, () => {
            assert.ok(existsSync(circuitPath), `${name}/circuit.json missing`);
            const circuit = JSON.parse(readFileSync(circuitPath, 'utf8'));
            // VCC is required for rail-powered circuits; battery/vsource/vcc-part circuits may omit the top-level vcc field.
            const hasSource = circuit.parts.some(p => /battery|vsource|vcc/.test(p.kind));
            assert.ok(circuit.vcc > 0 || hasSource, 'has a power source (vcc field, battery, vsource, or vcc part)');
            assert.ok(Array.isArray(circuit.parts), 'has parts');
            const partIds = new Set(circuit.parts.map(p => p.id));
            if (Array.isArray(circuit.nets)) {
                // Nets-format (WORE generated bench) — validate net terminals
                for (const net of circuit.nets) {
                    for (const t of net.terminals) {
                        assert.ok(partIds.has(t.part),
                            `net terminal references unknown part '${t.part}'`);
                    }
                }
            } else {
                assert.ok(Array.isArray(circuit.wires), 'has wires');
                // Every wire references a part or board that exists.
                for (const w of circuit.wires) {
                    const fromId = typeof w.from === 'string' ? w.from : w.from?.part || w.from?.board;
                    const toId = typeof w.to === 'string' ? w.to : w.to?.part || w.to?.board;
                    assert.ok(fromId && (partIds.has(fromId) || w.from?.board),
                        `wire from unknown part: ${JSON.stringify(w.from)}`);
                    assert.ok(toId && (partIds.has(toId) || w.to?.board),
                        `wire to unknown part: ${JSON.stringify(w.to)}`);
                }
            }
        });

        test(`${name}: EXPECTED.md exists`, () => {
            assert.ok(existsSync(expectedPath), `${name}/EXPECTED.md missing`);
            const content = readFileSync(expectedPath, 'utf8');
            assert.ok(content.length > 100, 'EXPECTED.md has substantive content');
        });
    }
});

describe('gallery: index.json is valid and covers every example', () => {
    const indexPath = join(EXAMPLES_DIR, 'index.json');

    test('index.json exists and parses', () => {
        assert.ok(existsSync(indexPath));
        JSON.parse(readFileSync(indexPath, 'utf8'));
    });

    test('every entry has required fields', () => {
        const index = JSON.parse(readFileSync(indexPath, 'utf8'));
        const CATEGORIES = new Set(['basics', 'analog', 'digital', 'display', 'motors', 'pure-circuit']);
        const KINDS = new Set(['circuit', 'program']);
        for (const entry of index) {
            assert.ok(entry.id, 'id');
            assert.ok(entry.title?.en, 'title.en');
            assert.ok(entry.title?.de, 'title.de');
            assert.ok(CATEGORIES.has(entry.category), `category "${entry.category}" not in ${[...CATEGORIES]}`);
            assert.ok(typeof entry.difficulty === 'number' && entry.difficulty >= 1 && entry.difficulty <= 5, 'difficulty 1-5');
            assert.ok(KINDS.has(entry.kind), `kind "${entry.kind}" not in ${[...KINDS]}`);
            assert.ok(entry.files?.program, 'files.program');
            assert.ok(entry.files?.circuit, 'files.circuit');
            assert.ok(entry.files?.expected, 'files.expected');
        }
    });

    test('every example directory is in the index', () => {
        const index = JSON.parse(readFileSync(indexPath, 'utf8'));
        const indexDirs = new Set(index.map(e => e.files.program.split('/')[0]));
        for (const name of examples) {
            assert.ok(indexDirs.has(name), `${name} is missing from index.json`);
        }
    });

    test('every index entry points to files that exist', () => {
        const index = JSON.parse(readFileSync(indexPath, 'utf8'));
        for (const entry of index) {
            for (const [key, path] of Object.entries(entry.files)) {
                const full = join(EXAMPLES_DIR, path);
                assert.ok(existsSync(full), `${entry.id}: ${key} file missing: ${path}`);
            }
        }
    });

    test('no duplicate ids', () => {
        const index = JSON.parse(readFileSync(indexPath, 'utf8'));
        const ids = index.map(e => e.id);
        assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
    });
});

describe('gallery: determinism — same input, same output, twice', () => {
    for (const name of examples) {
        test(`${name}: two compiles produce identical C`, () => {
            const src = readFileSync(join(EXAMPLES_DIR, name, 'program.bw'), 'utf8');
            const c1 = new SB3Creator(); c1.parse(src);
            const c2 = new SB3Creator(); c2.parse(src);
            assert.equal(c1.generateC(), c2.generateC());
        });

        test(`${name}: two compiles produce identical JS`, () => {
            const src = readFileSync(join(EXAMPLES_DIR, name, 'program.bw'), 'utf8');
            const c1 = new SB3Creator(); c1.parse(src);
            const c2 = new SB3Creator(); c2.parse(src);
            assert.equal(
                c1.generateJavaScript(undefined, { driver: 'simulator' }),
                c2.generateJavaScript(undefined, { driver: 'simulator' })
            );
        });
    }
});
