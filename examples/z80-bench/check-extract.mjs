/**
 * Verify the z80-bench circuit extracts to the Searle-shape Z80 preset
 * with zero refusals. Run from any directory:
 *   node examples/z80-bench/check-extract.mjs
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

const { extractZ80Machine } = await import(join(boardDir, 'src', 'z80-extract.js'));

const circuit = JSON.parse(readFileSync(circuitPath, 'utf8'));
const result = extractZ80Machine(circuit);

// Must succeed with zero refusals
assert.ok(result.ok, `extraction failed: ${result.reasons.join('; ')}`);
assert.deepEqual(result.reasons, [], 'expected zero refusals');

// Must produce the Searle-shape Z80 preset map
const expected = [
    'MAP RAM $8000-$FFFF',
    'MAP ROM $0000-$7FFF',
    'CHIP acia = MC6850 AT PORT $0080',
];
assert.deepEqual(result.lines, expected,
    `extraction lines do not match Searle preset:\n  got:  ${result.lines.join(', ')}\n  want: ${expected.join(', ')}`);

console.log('z80-bench: extraction matches Searle Z80 preset — PASS');
console.log('  lines:', result.lines);
console.log('  notes:', result.notes);
