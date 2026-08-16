// benchFor(example, device) — the write-once-run-everywhere bench generator.
// PROVEN SPIKE (2026-08-16): retargetPseudocode(blink, 'arduino-uno') -> led1=D13,
// retarget(..., 'pico') -> led1=GP25; inferNetlist(retargeted roles) -> the bench
// (vcc,gnd,mcu,resistor,led). Roles are the portable artifact; pins/benches derive.
//
// Remaining to productionize (ROADMAP "write-once-run-everywhere", stc e4451db):
//  1. Swap the generic 'mcu' part for the device part kind (attiny88, arduino_uno,
//     pi_pico, stc15_mcu... — the PASSTHROUGH work makes them device-true).
//  2. Seat via bw-circuit-ui scripts/seat-examples.mjs machinery.
//  3. Emit examples/<id>/circuit.<device>.json for every device in the example's
//     `devices` list; the example card's device picker loads program-retarget +
//     matching bench together.
//  4. Migrate portable-tier examples to role form; delete their hardcoded benches.
// Usage: node scripts/gen-device-benches.mjs <exampleId> <device>
import SB3Creator from '../src/utils/sb3Creator.js';
import { readFileSync, writeFileSync } from 'node:fs';

const [id, device] = process.argv.slice(2);
if (!id || !device) { console.error('usage: gen-device-benches.mjs <exampleId> <device>'); process.exit(1); }
const src = readFileSync(`examples/${id}/program.bw`, 'utf8');
const r = SB3Creator.retargetPseudocode(src, device);
if (!r.ok) { console.error(`refused: ${r.reasons.join('; ')}`); process.exit(1); }
const c = new SB3Creator();
c.parse(r.pseudocode ?? r.src ?? r.text);
console.log(JSON.stringify({ device, pins: c.project.stc.pins.map(p => ({ name: p.name, where: p.where ?? `P${p.port}.${p.bit}` })) }, null, 1));
// inferNetlist lives engine-side (bw-board); the catalog build imports it there.
