/**
 * Verify the eater6502-bench circuit extracts to the EATER6502 preset map
 * with zero refusals. Run from any directory:
 *   node examples/eater6502-bench/check-extract.mjs
 *
 * Requires a bw-board checkout at ../../bw-board (sibling convention) or
 * the path in BW_BOARD_DIR.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const circuitPath = join(__dirname, 'circuit.json');

const boardDir = process.env.BW_BOARD_DIR
    || join(__dirname, '..', '..', '..', '..', 'bw-board');

const { extract6502Machine } = await import(join(boardDir, 'src', 'm6502-extract.js'));

const circuit = JSON.parse(readFileSync(circuitPath, 'utf8'));
const result = extract6502Machine(circuit);

// Must succeed with zero refusals
assert.ok(result.ok, `extraction failed: ${result.reasons.join('; ')}`);
assert.deepEqual(result.reasons, [], 'expected zero refusals');

// Must produce the EATER6502 preset map
const expected = [
    'MAP RAM $0000-$3FFF',
    'MAP ROM $8000-$FFFF',
    'CHIP via = W65C22 AT $6000',
    'CHIP acia = W65C51 AT $5000',
];
assert.deepEqual(result.lines, expected,
    `extraction lines do not match EATER6502 preset:\n  got:  ${result.lines.join(', ')}\n  want: ${expected.join(', ')}`);

console.log('eater6502-bench: extraction matches EATER6502 preset — PASS');
console.log('  lines:', result.lines);
console.log('  notes:', result.notes);
