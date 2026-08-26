/**
 * Verify the Aurora-65 circuit extracts to its complete workstation map
 * with zero refusals. Run from any directory:
 *   node examples/aurora65-workstation/check-extract.mjs
 *
 * Uses the bw-board implementation shipped with this scratch-gui overlay.
 * BW_BOARD_DIR can override that directory for engine development.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const circuitPath = join(__dirname, 'circuit.json');

const boardDir = process.env.BW_BOARD_DIR
    || join(__dirname, '..', '..', 'src', 'lib', 'bw-board');

const { extract6502Machine } = await import(join(boardDir, 'm6502-extract.js'));

const circuit = JSON.parse(readFileSync(circuitPath, 'utf8'));
const result = extract6502Machine(circuit);

// Must succeed with zero refusals
assert.ok(result.ok, `extraction failed: ${result.reasons.join('; ')}`);
assert.deepEqual(result.reasons, [], 'expected zero refusals');

// Must produce the Aurora-65 workstation map.
const expected = [
    'MAP RAM $0000-$3FFF',
    'MAP ROM $8000-$FFFF',
    'CHIP via = W65C22 AT $6000',
    'CHIP acia = W65C51 AT $5000',
    'CHIP vga = SIMPLEVGA',
];
assert.deepEqual(result.lines, expected,
    `extraction lines do not match Aurora-65:\n  got:  ${result.lines.join(', ')}\n  want: ${expected.join(', ')}`);

console.log('aurora65-workstation: complete machine extraction — PASS');
console.log('  lines:', result.lines);
console.log('  notes:', result.notes);
