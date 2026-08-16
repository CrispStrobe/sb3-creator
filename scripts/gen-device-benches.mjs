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
// PIPELINE STATE (2026-08-16, coordinator run): blink x arduino-uno and
// blink x attiny88 produce ENGINE-ACCEPTED, POWERED, device-true benches
// end to end (retarget -> infer -> device part swap w/ lowercase terminal
// normalization -> BoardImpl.setNetlist ok). Two shaping findings:
//  A. pico: the pool assigns led1=GP25 (onboard-LED convention) but the
//     pi_pico part models the 40-pin HEADER, where gp25 is not bonded.
//     Resolve by contract: either the part gains gp25 + an onboard-LED
//     composite, or bench-generation pools prefer header pins (GP15) for
//     external-part roles. Decide once, in the peripheral-model style.
//  B. stc15_mcu (and any PASSTHROUGH kind): benchFor must validate through
//     the cui Circuit model (fromJSON + _syncNetlist, which applies
//     engineKindFor collapse) -- raw BoardImpl.setNetlist correctly rejects
//     palette-only kinds. circuit.json keeps the device kind for rendering;
//     the collapse is the model's job, same as every shipped example.
// Usage: node scripts/gen-device-benches.mjs <exampleId> <device>
import SB3Creator from '../src/utils/sb3Creator.js';
import { readFileSync, writeFileSync } from 'node:fs';

// Validation contract (finding B): the emitted circuit.json keeps DEVICE
// part kinds for rendering; engine validation must go through the cui
// Circuit model (fromJSON + _syncNetlist applies engineKindFor collapse),
// exactly like every shipped example. The catalog build wires that in;
// this CLI validates raw only for registered-device kinds.
const [id, device] = process.argv.slice(2);
if (!id || !device) { console.error('usage: gen-device-benches.mjs <exampleId> <device>'); process.exit(1); }
const src = readFileSync(`examples/${id}/program.bw`, 'utf8');
const r = SB3Creator.retargetPseudocode(src, device);
if (!r.ok) { console.error(`refused: ${r.reasons.join('; ')}`); process.exit(1); }
const c = new SB3Creator();
c.parse(r.pseudocode ?? r.src ?? r.text);
console.log(JSON.stringify({ device, pins: c.project.stc.pins.map(p => ({ name: p.name, where: p.where ?? `P${p.port}.${p.bit}` })) }, null, 1));
// inferNetlist lives engine-side (bw-board); the catalog build imports it there.
