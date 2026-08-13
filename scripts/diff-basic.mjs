#!/usr/bin/env node
/**
 * The BASIC-lane live differential: blocks → generateBASIC (bbc profile) →
 * TYPED line by line into BBC BASIC running on the 6502 machine (BeebEater)
 * → serial output and VIA pin edges checked against the program's meaning.
 * The block program executes inside a 1981 interpreter, and the pins move.
 *
 * Needs bw-board (BW_BOARD_DIR / siblings) and the local BeebEater clone
 * (see bw-board scripts/beebeater-smoke.mjs for the recipe + the LCD and
 * pacing facts this script inherits). Skips loudly without either.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const boardDir = process.env.BW_BOARD_DIR
    || [join(root, '..', 'bw-board'), join(homedir(), 'code', 'wt', 'bw-board')]
        .find((d) => existsSync(join(d, 'src', 'm6502-machine.js')));
const romPath = process.env.BEEBEATER_ROM || join(homedir(), 'code', 'BeebEater', 'BeebEater.rom');
if (!boardDir || !existsSync(romPath)) {
    console.error('SKIP (loudly): needs bw-board and the BeebEater clone');
    process.exit(2);
}
const { M6502Machine, EATER6502 } = await import(join(boardDir, 'src', 'm6502-machine.js'));

const src = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : `DEVICE EATER6502
PIN led1 = PA0 OUTPUT
PIN btn = PB0 INPUT

DEFINE blink_times (n):
  REPEAT n:
    toggle led1
    wait 0.2 seconds

WHEN flag clicked:
  set count to 0
  REPEAT 3:
    change count by 1
    print count
  IF (read btn = 1) THEN:
    blink_times 2
  ELSE:
    print 99
  FOREVER:
    toggle led1
    wait 0.5 seconds
`;

const c = new SB3Creator();
c.parse(src);
if ((c.warnings || []).length) { console.error('parse:', c.warnings); process.exit(1); }
const g = c.generateBASIC(undefined, {});
if (!g.ok) { console.error('generateBASIC refused:', g.reasons); process.exit(1); }

let out = '';
const edges = [];
const m = new M6502Machine(EATER6502, {
    onSerial: (b) => { out += String.fromCharCode(b); },
    onPinChange: (pin, level, tMs) => { if (pin === 'via1.PA0') edges.push({ tMs, level }); },
});
m.loadRom(readFileSync(romPath), 0x8000);
m.reset();
for (let b = 0; b < 8; b++) { m.chips.via1.setInput('b', b, 0); m.chips.via1.setInput('a', b, 0); }
m.advanceToMs(4000);
const type = (s) => { for (const ch of s) {
    m.chips.acia1.rxPush(ch.charCodeAt(0));
    m.advanceToMs(m.tMs + (ch === '\r' ? 300 : 30));
} };
for (const line of g.basic.trim().split('\n')) type(line + '\r');
const t0 = m.tMs;
type('RUN\r');
m.advanceToMs(m.tMs + 4000);

const printed = (out.split('RUN').pop() || '').replace(/\s+/g, ' ');
let post = edges.filter((e) => e.tMs > t0);
while (post.length && post[0].level === 0) post.shift();   // intent-0 seeding
const deltas = post.slice(1, 5).map((e, i) => e.tMs - post[i].tMs);
console.log('serial:', JSON.stringify(printed.slice(0, 60)), '| PA0 spacing:',
    deltas.map((d) => Math.round(d)).join(','));
const ok = /1\D+2\D+3\D+99/.test(printed)
    && deltas.length >= 3 && deltas.every((d) => Math.abs(d - 500) < 60);
console.log(ok ? 'AGREE — the block program executes inside BBC BASIC, pins moving.'
    : 'MISMATCH — see the transcript above');
process.exit(ok ? 0 : 1);
