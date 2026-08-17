/**
 * Verify the z80-pd-bench circuit extracts to the PainfulDiodes memory map
 * with zero refusals. Run from any directory:
 *   node examples/z80-pd-bench/check-extract.mjs
 *
 * Requires a bw-board checkout at ../../bw-board (sibling convention) or
 * the path in BW_BOARD_DIR.
 *
 * Stage one landed (2026-08-17): the bench carries the classic OUT latch
 * (74HC374 + LEDs) and IN buffer (74HC244 + DIP switches), strobed by
 * OR(/IORQ,/WR) and OR(/IORQ,/RD), legally SHARING port 0 — IN and OUT
 * decode to different silicon. Both chips are asserted below, direction
 * and port included. The UM245R note still holds for the serial face.
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
const mapLines = result.lines.filter((l) => l.startsWith('MAP'));
assert.deepEqual(mapLines, [
    'MAP RAM $8000-$FFFF',
    'MAP ROM $0000-$7FFF',
], `memory map does not match PainfulDiodes:\n  got: ${mapLines.join(', ')}`);

// Stage one: the OUT latch and the IN buffer share port 0 by direction.
assert.deepEqual(result.ports, [
    { kind: 'latch', name: 'latch1', at: 0 },
    { kind: 'buffer', name: 'in1', at: 0 },
], `stage-one ports missing or moved:\n  got: ${JSON.stringify(result.ports)}`);

console.log('z80-pd-bench: PainfulDiodes map + stage-one I/O — PASS');
console.log('  lines:', result.lines);
console.log('  ports:', result.ports);
console.log('  notes:', result.notes);
