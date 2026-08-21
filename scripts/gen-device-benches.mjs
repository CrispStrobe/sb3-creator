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
//   node scripts/gen-device-benches.mjs seat --reseat — deliberately rebuild
//     every generated bench after a geometry/power seating migration.
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
import { DEVPART } from './lib/devpart.mjs';

const cmd = process.argv[2];

import { transformAuthored } from './lib/authored-transform.mjs';

async function batch() {
  const SB3Creator = (await import('../src/utils/sb3Creator.js')).default;
  const eng = await import(path.join(BW_BOARD, 'src/index.js'));
  (await import(path.join(BW_BOARD, 'src/register-all.js'))).registerAllDevices();
  const engmod = await import(path.join(CUI, 'src/engine.js'));
  engmod.setEngine({ BoardImpl: eng.BoardImpl, inferNetlist: eng.inferNetlist,
    checkWiring: eng.checkWiring, hasDevice: eng.hasDevice });
  const cmod = await import(path.join(CUI, 'src/model/circuit.js'));
  // Authored circuits omit terminals on sidecar-known kinds — register the
  // sidecars so Circuit.fromJSON resolves them (same bulk-load as the
  // seat generator).
  const preg = await import(path.join(CUI, 'src/model/parts-registry.js'));
  for (const f of fs.readdirSync(path.join(CUI, 'src/parts-data'))) {
    if (!f.endsWith('.json')) continue;
    try {
      const sc = JSON.parse(fs.readFileSync(path.join(CUI, 'src/parts-data', f), 'utf8'));
      if (sc.kind) preg.registerSidecar(sc);
    } catch { /* bw-parts' problem */ }
  }
  const idx = JSON.parse(fs.readFileSync('examples/index.json', 'utf8'));
  const list = Array.isArray(idx) ? idx : idx.examples;
  let gen = 0, refused = 0, transformed = 0;
  for (const e of list) {
    if (!e.devices || e.devices.length < 2) continue;
    if (!(e.kind === 'program' || e.kind === 'full')) continue;
    let src;
    try { src = fs.readFileSync(`examples/${e.id}/program.bw`, 'utf8'); } catch { continue; }
    const authoredPath = `examples/${e.id}/circuit.json`;
    const hasAuthored = fs.existsSync(authoredPath);
    const exDev = ((src.match(/^DEVICE\s+([\w-]+)/im) || [])[1] || '')
      .toLowerCase().replace(/_/g, '-');
    for (const device of e.devices) {
      if (!DEVPART[device]) continue;
      const out = `examples/${e.id}/circuit.${device}.json`;
      if (fs.existsSync(out)) continue;
      // The authored device loads the authored circuit itself — a
      // generated file for it would never be requested and could only
      // disagree.
      if (hasAuthored && device === exDev) continue;
      // retargetPseudocode is the IDENTITY for the program's own device
      // (returns the source verbatim) — the authored pins ARE the
      // assignment, so the bench pairs with the program the app runs
      // (49-lcd-hello dark on the STC12, owner report 2026-08-17).
      const r = SB3Creator.retargetPseudocode(src, device);
      if (!r.ok) { refused++; continue; }
      if (hasAuthored) {
        const data = JSON.parse(fs.readFileSync(authoredPath, 'utf8'));
        // Parse the retargeted program: the transform needs pin DIRECTIONS
        // to synthesize pull-downs for active-high inputs on targets
        // without internal ones.
        const rp = new SB3Creator();
        let rpins = null;
        try { rp.parse(r.pseudocode ?? src); rpins = rp.project?.stc?.pins || null; } catch { /* transform degrades */ }
        const t = transformAuthored(data, DEVPART[device], r.pinMap || [], cmod.Circuit, SB3Creator.RETARGET_POOLS[device], device, rpins);
        if (!t.ok) {
          console.log(`${e.id} x ${device}: authored transform refused — ${t.reason}`);
          refused++; continue;
        }
        fs.writeFileSync(out, JSON.stringify(t.out, null, 1));
        transformed++; continue;
      }
      const c = new SB3Creator();
      try { c.parse(r.pseudocode ?? r.src ?? r.text); } catch { refused++; continue; }
      // A program drives hardware through PIN declarations OR a PART
      // binding (PART leds = 74HC595 claims pins with zero PIN lines).
      // Gating on pins alone refused every PART-only program — the 8-LED
      // chaser never got a single bench, so the app's device picker fell
      // back to the authored STC12 circuit on every device (owner report,
      // 2026-08-17).
      if (!c.project?.stc?.pins?.length && !c.project?.stc?.parts?.length) { refused++; continue; }
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
  console.log(`batch: generated ${gen}, transformed ${transformed}, retarget-refused ${refused}`);
}

function seat() {
  const seatgen = path.join(CUI, 'scripts/seat-examples.mjs');
  const reseatExisting = process.argv.includes('--reseat');
  let seated = 0, failed = 0, unseated = 0;
  for (const f of fs.globSync ? fs.globSync('examples/*/circuit.*.json')
      : require('glob').sync('examples/*/circuit.*.json')) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!reseatExisting && d.parts.some(p => p.seat)) continue;
    const exid = f.split(path.sep)[1];
    const device = path.basename(f).replace('circuit.', '').replace('.json', '');
    // Wires-form benches (the authored-circuit transforms) keep their
    // wires; nets-form benches (synthesis output) convert nets to a
    // star of wires. Assuming nets-form unconditionally staged every
    // TRANSFORMED bench with ZERO wires — the seat pass then wrote back
    // a parts list with no connectivity at all (the black calculator
    // OLED on the Pico: firmware bit-banged perfectly into a bus that
    // did not exist).
    const wires = [...(d.wires ?? [])];
    for (const net of d.nets ?? []) {
      const ts = net.terminals;
      for (const t of ts.slice(1)) wires.push({ from: ts[0].part, fromTerminal: ts[0].terminal,
        to: t.part, toTerminal: t.terminal });
    }
    const scratch = `/tmp/wore-batch/${exid}-${device}/${exid}`;
    fs.mkdirSync(scratch, { recursive: true });
    fs.writeFileSync(path.join(scratch, 'circuit.json'),
      JSON.stringify({ vcc: d.vcc, parts: d.parts, wires, holeWires: d.holeWires ?? [] }, null, 1));
    // A transformed authored circuit CARRIES its boards, with floating
    // hand-laid parts — re-author it: --reseat strips the bb* boards,
    // seats every part, and generates jumpers + rail power. Without it
    // the CUI generator skipped 'has-board' and the bench shipped
    // UNSEATED (owner screenshot: buttons hovering between boards, no
    // visible wiring anywhere).
    const args = [seatgen, '--examples', `/tmp/wore-batch/${exid}-${device}`, '--only', exid];
    if (reseatExisting || d.parts.some((p) => p.kind === 'breadboard')) args.push('--reseat');
    const outText = execFileSync('node', args, { encoding: 'utf8' });
    // Success is SEATS IN THE OUTPUT, not a substring: the old
    // outText.includes('seated') matched the summary line even on a
    // skip, restamped the unchanged file as benchFor+seat, and shipped
    // it unseated.
    const seatedD = JSON.parse(fs.readFileSync(path.join(scratch, 'circuit.json'), 'utf8'));
    if (seatedD.parts.some((p) => p.seat)) {
      seatedD.generated = String(d.generated || '').includes('authored')
        ? 'benchFor+authored+seat' : 'benchFor+seat';
      fs.writeFileSync(f, JSON.stringify(seatedD, null, 1));
      seated++;
    } else if (/skipped/.test(outText)) {
      // 'nothing-seatable' is a legitimate bench: a dev board with no
      // breadboard footprint (the Mega) plus power symbols and its
      // logical wires — the serial-only lessons. The transform output
      // on disk IS the bench; nothing to seat, nothing to fail.
      unseated++;
    } else {
      console.log(`seat: ${exid} x ${device} produced no seats — ${outText.split('\n').find((l) => l.includes(exid)) || 'no detail'}`);
      failed++;
    }
  }
  console.log(`seat: ${seated} seated, ${unseated} legitimately unseated, ${failed} failed`);
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
else { console.error('usage: gen-device-benches.mjs batch|seat [--reseat]|index'); process.exit(1); }
