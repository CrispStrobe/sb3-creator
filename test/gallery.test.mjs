// Headless verification of the starter-circuits gallery.
// Each example: parse .bw → generateJavaScript({driver:'simulator'}) → run with
// a mock board → assert pin states match EXPECTED.md numbers.
//
// This is the first regression suite that spans pseudocode → blocks → JS → board.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'node:url';
import { requireSiblings, siblingGuardTest, locate } from './helpers/siblings.mjs';
import SB3Creator from '../src/utils/sb3Creator.js';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const EXAMPLES_DIR = join(import.meta.dirname, '..', 'examples');

// The circuit.json wire check below reads endpoints, which arrive in two
// dialects MIXED WITHIN ONE FILE. It used to carry a private reader for them
// (`typeof w.from === 'string' ? w.from : w.from?.part || w.from?.board`) —
// one of seven such copies, and copies of this rule are what produced the
// 802-phantom-short scan and two exporters that wrote schematics with no nets
// in them. bw-circuit-ui owns the format, so the reader comes from there.
// Only the `circuit.json is valid` test gains the sibling dependency; it
// skips locally without the checkout and CI clones it at the pinned revision.
const cuiGate = requireSiblings('bw-circuit-ui');
siblingGuardTest(cuiGate, 'the gallery circuit.json wire check');
const { wireEndpoint } = cuiGate.skip ? {}
    : await import(pathToFileURL(join(locate('bw-circuit-ui').path,
        'src', 'model', 'wire-endpoints.js')).href);

// Index-based circuit path lookup (WORE contract: discover via manifest, never by glob)
const _index = JSON.parse(readFileSync(join(EXAMPLES_DIR, 'index.json'), 'utf8'));
const _indexByDir = new Map(_index.map(e =>
    [(e.files?.program ?? e.files?.circuit)?.split('/')[0], e]));
function circuitPathFor(dir, name) {
    const entry = _indexByDir.get(name);
    if (entry?.files?.circuit) return join(EXAMPLES_DIR, entry.files.circuit);
    return join(dir, 'circuit.json');
}

// Find all example directories
const examples = readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    // AUDIT is the auditors' workspace (findings ledgers, sweep notes) —
    // it is not an example and is not enrolled in index.json. Gate only
    // directories that are examples: enrolled, or carrying a program.bw.
    .filter(name => _indexByDir.has(name)
        || existsSync(join(EXAMPLES_DIR, name, 'program.bw')))
    .sort();

describe('gallery: every example parses and compiles', () => {
    for (const name of examples) {
        const dir = join(EXAMPLES_DIR, name);
        const bwPath = join(dir, 'program.bw');
        const circuitPath = circuitPathFor(dir, name);
        const expectedPath = join(dir, 'EXPECTED.md');
        // Circuit-only examples (enrolled without files.program: contention
        // lessons, TTL modules) have no program to gate — the program-side
        // tests are skipped for them; circuit + EXPECTED still run below.
        const hasProgram = existsSync(bwPath)
            || !!_indexByDir.get(name)?.files?.program;

        // An example may DECLARE warnings it deliberately carries — e.g.
        // 79-a2-sampler teaches the A2's measured P2 conflict (74HC138
        // select + LEDs on one port), and the compiler's warning about it
        // IS the lesson. Each pattern must match at least one warning and
        // every warning must match a pattern — still a ratchet, not a
        // blanket allowance.
        const expectedWarnings = _indexByDir.get(name)?.expectedWarnings || [];
        const unexpectedWarnings = (warnings) => {
            const unmatched = warnings.filter((w) => !expectedWarnings.some((p) => w.includes(p)));
            const unmet = expectedWarnings.filter((p) => !warnings.some((w) => w.includes(p)));
            return { unmatched, unmet };
        };

        test(`${name}: program.bw parses with zero warnings`, { skip: !hasProgram }, () => {
            assert.ok(existsSync(bwPath), `${name}/program.bw missing`);
            const src = readFileSync(bwPath, 'utf8');
            const c = new SB3Creator();
            c.parse(src);
            const { unmatched, unmet } = unexpectedWarnings(c.warnings || []);
            assert.deepEqual(unmatched, [], `${name} parse warnings`);
            assert.deepEqual(unmet, [], `${name} declared expectedWarnings that did not occur`);
        });

        test(`${name}: generates C with zero warnings`, { skip: !hasProgram }, () => {
            const src = readFileSync(bwPath, 'utf8');
            const c = new SB3Creator();
            c.parse(src);
            const code = c.generateC();
            assert.ok(code.length > 0, 'non-empty C');
            assert.ok(!/@bw-end/.test(code) || /@bw-begin/.test(code), 'marker header present');
        });

        test(`${name}: C round-trips back to pseudocode`, { skip: !hasProgram }, () => {
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
            const { unmatched } = unexpectedWarnings(c2.warnings || []);
            assert.deepEqual(unmatched, [], `${name} recompile warnings`);
        });

        test(`${name}: pseudocode → C → pseudocode is a fixed point`, { skip: !hasProgram }, () => {
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

        test(`${name}: generates JavaScript with simulator driver`, { skip: !hasProgram }, () => {
            const src = readFileSync(bwPath, 'utf8');
            const c = new SB3Creator();
            c.parse(src);
            const js = c.generateJavaScript(undefined, { driver: 'simulator' });
            assert.ok(js.length > 0, 'non-empty JS');
        });

        // GREEN BUT INERT. `set variable op to 1` is not a dialect form — there
        // is no ^set variable rule — so it parses as assigning a variable NAMED
        // "variable op", while every read says `op`. Two variables: one written
        // and never read, one read and never written. Five gallery examples
        // shipped like that; each parsed with zero warnings, transpiled to
        // plausible code, and did nothing, because the branches guarded by the
        // read-only variable were unreachable.
        //
        // A declared pair (`variable_x`, `x`) is the decisive signature, and it
        // is general: any write/read name split shows up this way, not just the
        // `set variable` spelling that caused it here.
        test(`${name}: no variable is written under one name and read under another`,
            { skip: !hasProgram }, () => {
                const c = new SB3Creator();
                c.parse(readFileSync(bwPath, 'utf8'));
                const py = c.generatePython(undefined, {});
                const code = typeof py === 'string' ? py : (py.py ?? py.code ?? '');
                const declared = new Set([...code.matchAll(/^([A-Za-z_][A-Za-z0-9_]*) = /gm)].map(m => m[1]));
                const shadowed = [...declared]
                    .filter(v => v.startsWith('variable_') && declared.has(v.slice('variable_'.length)));
                assert.deepEqual(shadowed, [],
                    `${name}: ${shadowed.join(', ')} written but never read — `
                    + 'the source likely says `set variable X to ...` where the dialect wants `set X to ...`');
            });

        // Device-only examples (a micro:bit program is a self-contained board,
        // not a breadboard) carry no circuit.json — nothing to validate.
        test(`${name}: circuit.json is valid`,
            { skip: cuiGate.skip || !existsSync(circuitPath) }, () => {
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
                    for (const side of ['from', 'to']) {
                        const e = wireEndpoint(w, side);
                        assert.ok(e, `wire ${side} is unreadable in either dialect: ` +
                            `${JSON.stringify(w[side])}`);
                        // A hole endpoint names a breadboard, not a part; it is
                        // legal and has nothing to look up in partIds.
                        if (!e.part) continue;
                        assert.ok(partIds.has(e.part),
                            `wire ${side} unknown part: ${JSON.stringify(w[side])}`);
                    }
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
        const CATEGORIES = new Set(['basics', 'analog', 'digital', 'display', 'motors', 'pure-circuit', 'microbit']);
        const KINDS = new Set(['circuit', 'program', 'full']);
        for (const entry of index) {
            assert.ok(entry.id, 'id');
            assert.ok(entry.title?.en, 'title.en');
            assert.ok(entry.title?.de, 'title.de');
            assert.ok(CATEGORIES.has(entry.category), `category "${entry.category}" not in ${[...CATEGORIES]}`);
            assert.ok(typeof entry.difficulty === 'number' && entry.difficulty >= 1 && entry.difficulty <= 5, 'difficulty 1-5');
            assert.ok(KINDS.has(entry.kind), `kind "${entry.kind}" not in ${[...KINDS]}`);
            assert.ok(entry.files?.program || entry.files?.circuit, 'files.program or files.circuit');
            // A circuit file is required for every example EXCEPT device-only
            // ones (a micro:bit or SPIKE Prime program is a self-contained board
            // with no breadboard circuit); those carry a program + a single device.
            const deviceOnly = entry.deviceOnly === true || entry.authored === 'microbit' || entry.authored === 'spike';
            assert.ok(entry.files?.circuit || deviceOnly, 'files.circuit (unless device-only)');
            // 'full' entries (program + circuit lesson pages) may omit the
            // expected-trace file; circuit/program entries never do.
            if (entry.kind !== 'full') assert.ok(entry.files?.expected, 'files.expected');
        }
    });

    test('every example directory is in the index', () => {
        const index = JSON.parse(readFileSync(indexPath, 'utf8'));
        const indexDirs = new Set(index.map(e => (e.files.program ?? e.files.circuit).split('/')[0]));
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
        const hasProgram = existsSync(join(EXAMPLES_DIR, name, 'program.bw'));
        test(`${name}: two compiles produce identical C`, { skip: !hasProgram }, () => {
            const src = readFileSync(join(EXAMPLES_DIR, name, 'program.bw'), 'utf8');
            const c1 = new SB3Creator(); c1.parse(src);
            const c2 = new SB3Creator(); c2.parse(src);
            assert.equal(c1.generateC(), c2.generateC());
        });

        test(`${name}: two compiles produce identical JS`, { skip: !hasProgram }, () => {
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
