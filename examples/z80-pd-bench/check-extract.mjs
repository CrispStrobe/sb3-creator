/**
 * Verify the z80-pd-bench circuit extracts to the PainfulDiodes memory map
 * with zero refusals. Run from any directory:
 *   node examples/z80-pd-bench/check-extract.mjs
 *
 * Requires a bw-board checkout at ../../bw-board (sibling convention) or
 * the path in BW_BOARD_DIR.
 *
 * The absence of a CHIP line is asserted, not merely tolerated: this design's
 * only I/O device is a UM245R USB FIFO and no engine part models one. If a
 * CHIP line ever appears here, either the part landed (update this file and
 * EXPECTED.md) or something was substituted for the FIFO (do not).
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

assert.ok(result.ok, `extraction failed: ${result.reasons.join('; ')}`);
assert.deepEqual(result.reasons, [], 'expected zero refusals');

// ROM low, RAM high — /ROM_CE = /MREQ OR A15, /RAM_CE = /MREQ OR /A15.
const expected = [
    'MAP RAM $8000-$FFFF',
    'MAP ROM $0000-$7FFF',
];
assert.deepEqual(result.lines, expected,
    `extraction lines do not match the PainfulDiodes map:\n  got:  ${result.lines.join(', ')}\n  want: ${expected.join(', ')}`);

assert.deepEqual(result.ports, [],
    'no port chip should be recognised — the UM245R has no engine part, and an '
    + 'ACIA standing in for it would erase the whole point of this design');

console.log('z80-pd-bench: extraction matches the PainfulDiodes memory map — PASS');
console.log('  lines:', result.lines);
console.log('  ports:', result.ports, '(the USB FIFO is deliberately absent)');
console.log('  notes:', result.notes);
