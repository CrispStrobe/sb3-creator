#!/usr/bin/env node
/**
 * The 6502 crown differential: pseudocode -> generateC -> cc65 -> ROM ->
 * bw-board's M6502Machine trace vs the referee, compared with the
 * device's physics budgets (2 ms/byte paced serial, ~9 ms/s cooperative
 * drift, ~8 ms startup — see reference/6502-target/README.md).
 *
 * Needs cc65 on PATH and a bw-board checkout (BW_BOARD_DIR, default
 * ../bw-board then ~/code/wt/bw-board). Exits 2 with a loud message when
 * either is missing so a green CI run cannot be mistaken for a run.
 *
 *   node scripts/diff-6502.mjs                # built-in 3-task program
 *   node scripts/diff-6502.mjs path/to.bw     # a gallery program
 */
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace, compareTraces } from '../src/utils/traceOracle.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const boardDir = process.env.BW_BOARD_DIR
    || [join(root, '..', 'bw-board'), join(homedir(), 'code', 'wt', 'bw-board')]
        .find((d) => existsSync(join(d, 'src', 'm6502-machine.js')));
try { execSync('cc65 --version', { stdio: 'ignore' }); } catch {
    console.error('SKIP (loudly): cc65 not on PATH — brew install cc65');
    process.exit(2);
}
if (!boardDir) {
    console.error('SKIP (loudly): bw-board not found — set BW_BOARD_DIR');
    process.exit(2);
}
const { M6502Machine, EATER6502 } = await import(join(boardDir, 'src', 'm6502-machine.js'));

const HORIZON = 4000;
const DEFAULT = `DEVICE EATER6502
PIN led1 = PA0 OUTPUT
PIN led2 = PA1 OUTPUT
PIN btn = PB0 INPUT

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.5 seconds

WHEN flag clicked:
  FOREVER:
    IF (read btn = 1) THEN:
      turn on led2
    ELSE:
      turn off led2
    wait 0.1 seconds

WHEN flag clicked:
  set n to 0
  FOREVER:
    change n by 1
    print n
    wait 1 seconds
`;
const src = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : DEFAULT;
const STIM = [{ tMs: 1500, level: 1 }, { tMs: 2600, level: 0 }];

// ---- emit + compile --------------------------------------------------------
const c = new SB3Creator();
c.parse(src);
if ((c.warnings || []).length) { console.error('parse:', c.warnings); process.exit(1); }
const target = join(root, 'reference', '6502-target');
const work = mkdtempSync(join(tmpdir(), 'bw6502-'));
writeFileSync(join(work, 'prog.c'), c.generateC(undefined, {}));
const sh = (cmd) => execSync(cmd, { cwd: work, stdio: 'inherit' });
sh('cc65 -t none --cpu 65C02 -O -o prog.s prog.c');
sh('ca65 --cpu 65C02 -o prog.o prog.s');
sh(`ca65 --cpu 65C02 -o crt0.o ${join(target, 'crt0.s')}`);
sh(`ld65 -C ${join(target, 'eater.cfg')} -o prog.rom crt0.o prog.o none.lib`);
const rom = readFileSync(join(work, 'prog.rom'));

// ---- run on the machine ----------------------------------------------------
// A declared MAP/CHIP machine overrides the preset — chips at their declared
// addresses, the via's declared NAME prefixing the pins. (The ld65 cfg keeps
// the preset's RAM/ROM shape; generating a cfg from MAP lines is the noted
// follow-up, so declared regions must match it for now.)
const declared = c.project.stc.machine;
const machineCfg = declared
    ? { clockHz: c.project.stc.clock || 1000000, regions: declared.regions, chips: declared.chips }
    : EATER6502;
const viaName = declared
    ? (declared.chips.find((ch) => ch.kind === 'via') || { name: 'via1' }).name
    : 'via1';
const inputPins = new Map((c.project.stc.pins || [])
    .filter((p) => p.direction === 'input')
    .map((p) => [p.name.toLowerCase(), p.where.toUpperCase()]));
const outputPins = new Map((c.project.stc.pins || [])
    .filter((p) => p.direction === 'output')
    .map((p) => [`${viaName}.${p.where.toUpperCase()}`, p.name]));
const events = [];
const serial = [];
let line = null;
const m = new M6502Machine(machineCfg, {
    onPinChange: (pin, level, tMs) => { if (outputPins.has(pin)) events.push({ tMs, pin: outputPins.get(pin), level }); },
    onSerial: (byte, tMs) => {
        if (byte === 13) return;
        if (byte === 10) { if (line) serial.push({ tMs: line.t0, line: line.buf }); line = null; return; }
        if (!line) line = { t0: tMs, buf: '' };
        line.buf += String.fromCharCode(byte);
    },
});
m.loadRom(rom);
m.reset();
const drive = (level) => {
    for (const where of inputPins.values()) {
        const bit = Number(where[2]);
        m.chips[viaName].setInput(where[1] === 'A' ? 'a' : 'b', bit, level);
    }
};
drive(0);
let next = 0;
while (m.tMs < HORIZON && !m.cpu.stopped) {
    if (next < STIM.length && m.tMs >= STIM[next].tMs) { drive(STIM[next].level); next++; }
    m.advanceToMs(Math.min(m.tMs + 1, HORIZON));
}

// ---- referee + compare -----------------------------------------------------
const ref = interpretTrace(c.project, {
    horizonMs: HORIZON,
    stimulus: [{ tMs: 0 }, ...STIM].flatMap((s, i) => [...inputPins.keys()]
        .map((name) => ({ tMs: s.tMs ?? 0, pin: name, level: s.level ?? 0 }))),
});
if (ref.unsupported.length) { console.error('referee refused:', [...new Set(ref.unsupported)]); process.exit(1); }
const r = compareTraces(ref, { horizon: HORIZON, events, serial, pwm: [] },
    { serialMsPerByte: 2, driftPerSecMs: 25, startupMs: 15 });
console.log('referee:', ref.events.length, 'events,', ref.serial.length, 'lines |',
    'machine:', events.length, 'events,', serial.length, 'lines');
console.log(r.ok ? 'AGREE' : 'DIFFS:\n' + r.diffs.join('\n'));
process.exit(r.ok ? 0 : 1);
