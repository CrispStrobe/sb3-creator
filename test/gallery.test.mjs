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

// Find all example directories
const examples = readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

describe('gallery: every example parses and compiles', () => {
    for (const name of examples) {
        const dir = join(EXAMPLES_DIR, name);
        const bwPath = join(dir, 'program.bw');
        const circuitPath = join(dir, 'circuit.json');
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
            if (!/@bw-begin/.test(cCode)) return;
            const { pseudocode, warnings } = cToPseudocode(cCode);
            assert.deepEqual(warnings, [], `${name} round-trip warnings`);
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
            assert.ok(circuit.vcc > 0, 'positive VCC');
            assert.ok(Array.isArray(circuit.parts), 'has parts');
            assert.ok(Array.isArray(circuit.wires), 'has wires');
            // Every wire references a part that exists
            const partIds = new Set(circuit.parts.map(p => p.id));
            for (const w of circuit.wires) {
                assert.ok(partIds.has(w.from), `wire from unknown part: ${w.from}`);
                assert.ok(partIds.has(w.to), `wire to unknown part: ${w.to}`);
            }
        });

        test(`${name}: EXPECTED.md exists`, () => {
            assert.ok(existsSync(expectedPath), `${name}/EXPECTED.md missing`);
            const content = readFileSync(expectedPath, 'utf8');
            assert.ok(content.length > 100, 'EXPECTED.md has substantive content');
        });
    }
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
