#!/usr/bin/env node
/**
 * The BASIC lane's HOST oracle: generated (numbered) BBC BASIC stored and
 * RUN under R. T. Russell's own console interpreter (BBCSDL, zlib), the
 * printed values compared against the referee's serial stream. Three
 * independent executors now agree on the same programs: the referee
 * (virtual clock), BBC BASIC 4 on the 6502 machine (BeebEater, live),
 * and BBCSDL on the host (this script).
 *
 * VALUES ONLY: the host runs on wall time (TIME is real centiseconds), so
 * timing belongs to the machine differential, not here. HARDWARE-GATED:
 * a ?& poke on the host would hit the interpreter's own memory, so any
 * program using pin blocks is skipped with the reason.
 *
 * Setup: git clone --depth 1 https://github.com/rtrussell/BBCSDL ~/code/BBCSDL
 *        cd ~/code/BBCSDL/console/macm1 && make     (macos/ on Intel, linux/ on CI)
 *
 *   node scripts/oracle-bbcsdl.mjs            # built-in fixtures
 *   node scripts/oracle-bbcsdl.mjs prog.bw    # a program (hardware-gated)
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const BIN = process.env.BBCSDL_BIN
    || ['macm1', 'macos', 'linux'].map((d) => join(homedir(), 'code', 'BBCSDL', 'console', d, 'bbcbasic'))
        .find((p) => existsSync(p));
if (!BIN) {
    console.error('SKIP (loudly): BBCSDL console binary not found — see header for the build recipe');
    process.exit(2);
}

const FIXTURES = [`DEVICE EATER6502

DEFINE tally (n):
  REPEAT n:
    change total by 2
  print total

WHEN flag clicked:
  set total to 0
  REPEAT 3:
    change count by 1
    print count * 10
  tally 4
  IF (total > 5) THEN:
    print 777
  ELSE:
    print 111
  set k to 0
  REPEAT UNTIL k = 2:
    change k by 1
    print k + 100
`];

const sources = process.argv[2] ? [readFileSync(process.argv[2], 'utf8')] : FIXTURES;
let bad = 0;
for (const src of sources) {
    const c = new SB3Creator();
    c.parse(src);
    // stc12_print is PRINT — host-safe. Everything touching pins is not.
    const hw = (c.project.targets || []).some((t) => Object.values(t.blocks || {})
        .some((b) => b && /^(stc12|circuit|ledcube|devices)_/.test(b.opcode || '')
            && b.opcode !== 'stc12_print'));
    if (hw) { console.log('SKIP: uses hardware blocks — the host oracle is values-only'); continue; }
    const g = c.generateBASIC(undefined, {});
    if (!g.ok) { console.error('generateBASIC refused:', g.reasons); bad++; continue; }

    // Store the numbered program, RUN it, QUIT — all through stdin.
    const run = spawnSync(BIN, [], { input: g.basic + 'RUN\nQUIT\n', encoding: 'utf8', timeout: 30000 });
    const lines = run.stdout.split('\n');
    const runAt = lines.findIndex((l) => /^>RUN\s*$/.test(l.trim()) || l.trim() === '>RUN');
    const printed = [];
    for (let i = runAt + 1; i < lines.length; i++) {
        const l = lines[i];
        if (/^>/.test(l)) break;                 // next prompt: program ended
        if (l.trim()) printed.push(l.trim());
    }

    const ref = interpretTrace(c.project, { horizonMs: 60000 });
    if (ref.unsupported.length) {
        // A refusing referee is a blocked comparison, never a passing one —
        // this check's absence hid the referee's procedure gap for a round.
        console.error('referee refused:', [...new Set(ref.unsupported)]);
        bad++;
        continue;
    }
    const want = ref.serial.map((s) => String(s.line));
    const okRun = JSON.stringify(printed) === JSON.stringify(want);
    console.log('referee :', want.join(' '));
    console.log('bbcsdl  :', printed.join(' '));
    console.log(okRun ? 'AGREE — Russell\'s interpreter and the referee print the same values.'
        : 'MISMATCH');
    if (!okRun) bad++;
}
process.exit(bad ? 1 : 0);
