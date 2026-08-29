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

// The seat generator above only reads and writes `circuit.json` (see
// seat-examples.mjs, which joins that exact name). Every example also carries
// derived twins — `circuit-flat.json` and the per-device `circuit.<dev>.json`
// / `circuit-flat.<dev>.json` — and those are outside its reach entirely.
//
// This verification used to glob `examples/*/circuit.json`, i.e. precisely the
// files the generator had just rewritten, so it could only ever confirm the
// generator's own work. It reported "All primary Uno/Mega benches now use
// floating physical boards" while 61 `circuit-flat.json` files still carried
// the seats stamped by the deleted footprint stubs (uppercase D0..D13 legs).
// A check whose scope equals its subject's scope cannot find a miss.
const files = fs.globSync('examples/*/circuit*.json');
// MEASURED 2026-08-29 (direct count with this same glob): 2162 circuit files, so
// the guard sits at 41.6 % of actual — a deliberately loose sanity bound on the
// GLOB rather than a ratchet on the corpus, which is why it is not tightened.
if (files.length < 900) throw new Error(`only ${files.length} circuit files found — the glob is wrong`);

// Strip stale controller seats from the derived twins. In a flat variant the
// seat is already inert at load (its boardId names a breadboard the file does
// not contain, so Circuit.fromJSON drops it), but it is wrong data that this
// script claims to have removed, and it would come back to life in any file
// that regained a breadboard with that id.
let stripped = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const parts = data.parts || data.circuit?.parts || [];
  let touched = false;
  for (const part of parts) {
    if ((part.kind === 'arduino_uno' || part.kind === 'arduino_mega') && part.seat) {
      delete part.seat;
      touched = true;
    }
  }
  if (touched) { fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`); stripped++; }
}

const invalid = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const part of data.parts || data.circuit?.parts || []) {
    if ((part.kind === 'arduino_uno' || part.kind === 'arduino_mega') && part.seat) {
      invalid.push(`${file}: ${part.id}`);
    }
  }
}
if (invalid.length) throw new Error(`controller seating migration incomplete:\n${invalid.join('\n')}`);
console.log(`Checked ${files.length} circuit files (primary and derived twins); `
  + `stripped ${stripped}. All Uno/Mega benches now use floating physical boards.`);
