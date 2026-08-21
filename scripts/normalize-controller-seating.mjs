#!/usr/bin/env node
/**
 * Re-author legacy primary benches that physically seat an Uno/Mega on a
 * breadboard. Those boards have female headers and standoffs: they must float
 * beside the breadboard, while Nano and Pico remain genuinely seatable.
 *
 * The circuit-ui migration is deliberately selector-gated, so running this
 * command cannot touch curated passive benches or valid Nano/Pico layouts.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const cui = process.env.BW_CUI || path.join(os.homedir(), 'code', 'bw-circuit-ui');
const seatgen = path.join(cui, 'scripts', 'seat-examples.mjs');
if (!fs.existsSync(seatgen)) throw new Error(`seat generator missing: ${seatgen}`);

execFileSync(process.execPath, [seatgen, '--examples', 'examples', '--reseat', '--invalid-controllers-only'], {
  stdio: 'inherit',
});

const invalid = [];
for (const file of fs.globSync('examples/*/circuit.json')) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const part of data.parts || []) {
    if ((part.kind === 'arduino_uno' || part.kind === 'arduino_mega') && part.seat) {
      invalid.push(`${file}: ${part.id}`);
    }
  }
}
if (invalid.length) throw new Error(`controller seating migration incomplete:\n${invalid.join('\n')}`);
console.log('All primary Uno/Mega benches now use floating physical boards.');
