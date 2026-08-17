// The WORE bench pipeline — one role program, every bench derived.
// PROVEN AT CATALOG SCALE (2026-08-16): 278 benches generated, model-
// validated, and seated across 75 examples with zero rejections and zero
// seating failures (commits 0e7900a, 5d981c4, manifest e54b079).
//
// Subcommands:
//   node scripts/gen-device-benches.mjs batch   — generate + model-validate
//     circuit.<device>.json for every (multi-device program example ×
//     mapped device) that lacks one. Retarget refusals are honest
//     incompatibilities; engine rejections abort loudly.
//   node scripts/gen-device-benches.mjs seat    — seat every unseated
//     generated bench via the cui seat generator (nets→wires bridge,
//     scratch dirs under /tmp/wore-batch).
//   node scripts/gen-device-benches.mjs index   — regenerate the benches
//     map in examples/index.json from the filesystem (the picker's
//     contract; never hand-maintained).
// Run all three in order after adding/migrating examples.
//
// Requires sibling checkouts: bw-board (engine) and bw-circuit-ui (model +
// seat generator) — paths below; adjust per environment.
// Device→part table. Machine-class (eater6502, z80) is out of scope by
// nature — canonical benches, not generated ones. Pico joined 2026-08-17:
// the gp25 onboard-LED contract landed on both sides (engine ccfda9b,
// sidecar cui 3750d86), and the LED needs no wires — it is on the PCB.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOME = os.homedir();
const BW_BOARD = process.env.BW_BOARD ?? path.join(HOME, 'code/wt/bw-board');
const CUI = process.env.BW_CUI ?? path.join(HOME, '.claude/jobs/ef2c9a2a/tmp/cui-check');
const DEVPART = {
  'pico': 'pi_pico',
  'stc12c5a60s2': 'mcu', 'stc89c52rc': 'mcu', 'stc15f2k60s2': 'stc15_mcu',
  'arduino-uno': 'arduino_uno', 'arduino-nano': 'arduino_nano',
  'arduino-mega': 'arduino_mega', 'atmega168p': 'arduino_uno',
  'attiny88': 'attiny88', 'attiny85': 'attiny85',
};

const cmd = process.argv[2];

async function batch() {
  const SB3Creator = (await import('../src/utils/sb3Creator.js')).default;
  const eng = await import(path.join(BW_BOARD, 'src/index.js'));
  (await import(path.join(BW_BOARD, 'src/register-all.js'))).registerAllDevices();
  const engmod = await import(path.join(CUI, 'src/engine.js'));
  engmod.setEngine({ BoardImpl: eng.BoardImpl, inferNetlist: eng.inferNetlist,
    checkWiring: eng.checkWiring, hasDevice: eng.hasDevice });
  const cmod = await import(path.join(CUI, 'src/model/circuit.js'));
  const idx = JSON.parse(fs.readFileSync('examples/index.json', 'utf8'));
  const list = Array.isArray(idx) ? idx : idx.examples;
  let gen = 0, refused = 0;
  for (const e of list) {
    if (!e.devices || e.devices.length < 2) continue;
    if (!(e.kind === 'program' || e.kind === 'full')) continue;
    let src;
    try { src = fs.readFileSync(`examples/${e.id}/program.bw`, 'utf8'); } catch { continue; }
    for (const device of e.devices) {
      if (!DEVPART[device]) continue;
      const out = `examples/${e.id}/circuit.${device}.json`;
      if (fs.existsSync(out)) continue;
      const r = SB3Creator.retargetPseudocode(src, device);
      if (!r.ok) { refused++; continue; }
      const c = new SB3Creator();
      try { c.parse(r.pseudocode ?? r.src ?? r.text); } catch { refused++; continue; }
      if (!c.project?.stc?.pins?.length) { refused++; continue; }
      const usesLcd = /^\s*lcd /m.test(src);
      const nl = eng.inferNetlist(c.project.stc, { display: usesLcd ? 'lcd' : 'oled' });
      const kind = DEVPART[device];
      const ids = new Set();
      for (const p of nl.parts) if (p.kind === 'mcu') {
        p.kind = kind; ids.add(p.id);
        if (kind !== 'mcu') p.terminals = p.terminals.map(t => String(t).toLowerCase());
      }
      if (kind !== 'mcu') for (const n of nl.nets) for (const t of n.terminals)
        if (ids.has(t.part)) t.terminal = String(t.terminal).toLowerCase();
      const circ = cmod.Circuit.fromJSON({ vcc: 5, parts: nl.parts, wires: [], holeWires: [] });
      circ.syncWithExternalNets(nl.nets);
      if (circ.netlistError != null) {
        throw new Error(`${e.id} x ${device}: engine rejected — ${String(circ.netlistError).split('\n')[1]}`);
      }
      fs.writeFileSync(out, JSON.stringify({ vcc: 5, parts: nl.parts, nets: nl.nets,
        generated: 'benchFor' }, null, 1));
      gen++;
    }
  }
  console.log(`batch: generated ${gen}, retarget-refused ${refused}`);
}

function seat() {
  const seatgen = path.join(CUI, 'scripts/seat-examples.mjs');
  let seated = 0, failed = 0;
  for (const f of fs.globSync ? fs.globSync('examples/*/circuit.*.json')
      : require('glob').sync('examples/*/circuit.*.json')) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (d.parts.some(p => p.seat)) continue;
    const exid = f.split(path.sep)[1];
    const device = path.basename(f).replace('circuit.', '').replace('.json', '');
    const wires = [];
    for (const net of d.nets ?? []) {
      const ts = net.terminals;
      for (const t of ts.slice(1)) wires.push({ from: ts[0].part, fromTerminal: ts[0].terminal,
        to: t.part, toTerminal: t.terminal });
    }
    const scratch = `/tmp/wore-batch/${exid}-${device}/${exid}`;
    fs.mkdirSync(scratch, { recursive: true });
    fs.writeFileSync(path.join(scratch, 'circuit.json'),
      JSON.stringify({ vcc: d.vcc, parts: d.parts, wires, holeWires: [] }, null, 1));
    const outText = execFileSync('node', [seatgen, '--examples',
      `/tmp/wore-batch/${exid}-${device}`, '--only', exid], { encoding: 'utf8' });
    if (outText.includes('seated')) {
      const seatedD = JSON.parse(fs.readFileSync(path.join(scratch, 'circuit.json'), 'utf8'));
      seatedD.generated = 'benchFor+seat';
      fs.writeFileSync(f, JSON.stringify(seatedD, null, 1));
      seated++;
    } else failed++;
  }
  console.log(`seat: ${seated} seated, ${failed} failed`);
  if (failed) process.exit(1);
}

function index() {
  const p = 'examples/index.json';
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const list = Array.isArray(d) ? d : d.examples;
  let touched = 0;
  for (const e of list) {
    const files = fs.globSync(`examples/${e.id}/circuit.*.json`).sort();
    const devs = files.map(f => path.basename(f).replace('circuit.', '').replace('.json', ''));
    if (devs.length) { e.benches = Object.fromEntries(devs.map(v => [v, `${e.id}/circuit.${v}.json`])); touched++; }
    else if (e.benches) { delete e.benches; touched++; }
  }
  fs.writeFileSync(p, JSON.stringify(d, null, 1));
  console.log(`index: ${touched} entries carry a benches map`);
}

if (cmd === 'batch') await batch();
else if (cmd === 'seat') seat();
else if (cmd === 'index') index();
else { console.error('usage: gen-device-benches.mjs batch|seat|index'); process.exit(1); }
