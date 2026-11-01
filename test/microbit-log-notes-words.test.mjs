/**
 * The log's rows and log-full event, and note-string melodies, as words (brickwright-lite, 2026-11-01).
 * Log semantics are codal-microbit-v2's MicroBitLog.cpp: header is row 0, rows end in a newline, the
 * stamp column is "Time (units)" and comes first. A note string is MicroPython's music notation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const program = (body) => `DEVICE MICROBIT:\n  WHEN started:\n${body.map((l) => `    ${l}`).join('\n')}\n`;
const CASES = [
    ['set v to log rows from 0 count 2', '_bw_lg_rows(0, 2)'],
    ['set v to log row count from 1', '_bw_lg_count(1)'],
    ['log raise event when full', "_bw_lg['ev'] = True"],
    ['delete log', '_bw_lg_clear()'],
    ['play notes "C_D_E" tempo 120 until done', '_bw_play_notes("C_D_E", 120, True, False)'],
    ['play notes "C_D" tempo 90 in background', '_bw_play_notes("C_D", 90, False, False)'],
    ['play notes "C_D" tempo 90 looping in background', '_bw_play_notes("C_D", 90, False, True)'],
    ['play notes "C_D" tempo 90 forever', '_bw_play_notes("C_D", 90, True, True)']
];

test('each word becomes the MicroPython it stands for', () => {
    for (const [line, fragment] of CASES) {
        const set = /^set (\w+) to /.exec(line);
        const c = new SB3Creator();
        c.parse(program(set ? [line, `print ${set[1]}`] : [line]));
        const r = c.generateMicroPython();
        assert.ok(r.ok, `${line}: ${JSON.stringify(r.reasons)}`);
        assert.ok(r.py.includes(fragment), `${line}: wanted ${fragment}`);
    }
});

test('each word is a fixed point through decompile', () => {
    for (const [line] of CASES) {
        const set = /^set (\w+) to /.exec(line);
        const first = new SB3Creator().decompile(new SB3Creator().parse(program(set ? [line, `print ${set[1]}`] : [line])));
        assert.equal(new SB3Creator().decompile(new SB3Creator().parse(first)), first, line);
    }
});
