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

// ── Circuit-preserving retarget ──────────────────────────────────────
// A device pick on an example WITH an authored circuit must not
// synthesize a generic bench: it transforms the authored circuit — every
// non-MCU part byte-identical (seats, positions, params), the MCU
// swapped to the target's designer kind and re-wired per retarget's
// pinMap. The retargetter used to replace the whole console with a rank
// of LEDs (owner report, 2026-08-17). Synthesis remains the fallback
// for examples with no authored circuit.

const MCU_KINDS = new Set(['mcu', 'stc_mcu', 'stc15_mcu', ...Object.values(DEVPART)]);
const POWER_NAMES = new Set(['vcc', '5v', 'vdd', 'avcc', 'vbus', 'vsys', '3v3']);
const GROUND_NAMES = new Set(['gnd', 'gnd2', 'gnd3', 'vss', 'agnd', 'swd_gnd',
  'gnd_1', 'gnd_2', 'gnd_3', 'gnd_4', 'gnd_5', 'gnd_6', 'gnd_7']);
const POWER_EQUIV = {
  mcu: { power: 'VCC', ground: 'GND' },
  stc_mcu: { power: 'VCC', ground: 'GND' },
  stc15_mcu: { power: 'VCC', ground: 'GND' },
  arduino_uno: { power: '5v', ground: 'gnd' },
  arduino_nano: { power: '5v', ground: 'gnd' },
  arduino_mega: { power: '5v', ground: 'gnd' },
  pi_pico: { power: 'vsys', ground: 'gnd_1' },
  attiny88: { power: 'vcc', ground: 'gnd' },
  attiny85: { power: 'vcc', ground: 'gnd' },
};

// A hole's electrical strip: rail name, or column + block half.
function stripKeyOf(hole) {
  const rail = /^([tb][+-])/.exec(hole);
  if (rail) return rail[1];
  const m = /^([a-j])(\d+)$/.exec(hole);
  if (!m) return hole;
  return `${'abcde'.includes(m[1]) ? 'T' : 'B'}${m[2]}`;
}

// The devices' FULL pin spaces. Allocation pools are curated teaching
// subsets (they exclude UART/ISP pins deliberately), but the console kit
// wires a button on P3.0 and pong's 28 declared pins alone exhaust any
// pool — circuit-only extras draw from the real header space, in a
// deterministic order, and refuse only on true exhaustion (an ATtiny85
// honestly cannot carry a console).
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
function fullPinSpace(device) {
  const p8051 = (ports) => Object.entries(ports).flatMap(([port, bits]) =>
    bits.map((b) => `P${port}.${b}`));
  switch (device) {
    case 'stc12c5a60s2':
      return p8051({ 0: range(0, 7), 1: range(0, 7), 2: range(0, 7), 3: range(0, 7), 4: [4, 5, 6, 7] });
    case 'stc89c52rc':
      return p8051({ 0: range(0, 7), 1: range(0, 7), 2: range(0, 7), 3: range(0, 7) });
    case 'stc15f2k60s2':
      return p8051({ 0: range(0, 7), 1: range(0, 7), 2: range(0, 7), 3: range(0, 7), 4: range(0, 7), 5: [4, 5] });
    case 'arduino-mega':
      return [...range(2, 13).map((n) => `D${n}`), ...range(22, 53).map((n) => `D${n}`),
        ...range(0, 15).map((n) => `A${n}`)];
    case 'arduino-uno': case 'atmega168p':
      return [...range(2, 13).map((n) => `D${n}`), ...range(0, 5).map((n) => `A${n}`)];
    case 'arduino-nano': // A6/A7 are analog-in ONLY — not in the digital space
      return [...range(2, 13).map((n) => `D${n}`), ...range(0, 5).map((n) => `A${n}`)];
    case 'pico':
      return [...range(0, 22).map((n) => `GP${n}`), ...range(26, 28).map((n) => `GP${n}`)];
    default: return null; // fall back to the pools
  }
}

function transformAuthored(data, targetKind, pinMap, Circuit, pools, device) {
  const d = JSON.parse(JSON.stringify(data));
  const mcu = d.parts.find((p) => MCU_KINDS.has(p.kind));
  if (!mcu) return { ok: false, reason: 'no MCU part in authored circuit' };
  const isBoardTarget = !['mcu', 'stc_mcu', 'stc15_mcu'].includes(targetKind);
  const norm = (t) => String(t).toLowerCase();
  const map = new Map(pinMap.map((m) => [norm(m.from), m.to]));
  const equiv = POWER_EQUIV[targetKind];
  const caseTo = (t) => (isBoardTarget ? String(t).toLowerCase() : String(t));

  // Connectivity truth: rows, jumpers and wires unioned.
  const circ = Circuit.fromJSON(data);
  if (circ.netlistError) return { ok: false, reason: `authored circuit invalid: ${circ.netlistError}` };
  const nets = circ.resolvedNets || [];

  // Circuit-only pins: hardware the program never declares (the console
  // wires FIVE buttons, pong reads two). They carry over — the same
  // coordinate when the target's conventional pin space owns it
  // unclaimed, else the next free digital pool pin — and refuse only
  // when the pool is exhausted. Deterministic: iteration order is the
  // resolved-nets order, stable per input.
  const usedTargets = new Set(pinMap.map((m) => norm(m.to)));
  const space = fullPinSpace(device) || (pools?.digital || []);
  const spaceNorm = new Set(space.map(norm));
  const extraAssign = new Map();
  const xlate = (term) => {
    const t = norm(term);
    if (map.has(t)) return caseTo(map.get(t));
    if (POWER_NAMES.has(t)) return equiv.power;
    if (GROUND_NAMES.has(t)) return equiv.ground;
    if (extraAssign.has(t)) return extraAssign.get(t);
    // circuit-only extra: same coordinate when the target owns it
    // unclaimed, else the first unclaimed pin of the full space
    let nt = null;
    if (spaceNorm.has(t) && !usedTargets.has(t)) nt = caseTo(term);
    else for (const cand of space) {
      if (!usedTargets.has(norm(cand))) { nt = caseTo(cand); break; }
    }
    if (nt != null) { usedTargets.add(norm(nt)); extraAssign.set(t, nt); return nt; }
    return null;
  };

  // Strips the seated MCU's leads occupied — every jumper into them was
  // an MCU connection and is re-expressed as a logical wire below.
  const mcuStrips = new Set();
  if (mcu.seat) {
    for (const h of Object.values(mcu.seat.leadMap)) {
      mcuStrips.add(`${mcu.seat.boardId}:${stripKeyOf(h)}`);
    }
  }

  // One explicit wire from the mapped MCU terminal to EVERY other member
  // of its net (star): peripherals that met only in the MCU's strip stay
  // connected after the strip is vacated.
  const netWires = [];
  const seen = new Set();
  for (const n of nets) {
    const mcuTerms = n.terminals.filter((t) => t.part === mcu.id);
    if (!mcuTerms.length) continue;
    const others = n.terminals.filter((t) => t.part !== mcu.id);
    // A seated MCU puts EVERY lead on a strip, so an unconnected pin
    // still surfaces as a one-terminal net — nothing to carry, and
    // translating it would burn a target coordinate for nothing.
    if (!others.length) continue;
    for (const mt of mcuTerms) {
      const nt = xlate(mt.terminal);
      if (nt == null) {
        return { ok: false, reason:
          `MCU terminal ${mt.terminal} is wired but has no mapping on ${targetKind} — refusing rather than dropping the connection` };
      }
      for (const o of others) {
        const key = `${nt}|${o.part}|${o.terminal}`;
        if (seen.has(key)) continue;
        seen.add(key);
        netWires.push({ from: mcu.id, fromTerminal: nt, to: o.part, toTerminal: o.terminal });
      }
    }
  }

  const parts = d.parts.map((p) => {
    if (p.id !== mcu.id) return p;
    const q = { id: p.id, kind: targetKind, params: {}, x: 80, y: -60, rotation: 0 };
    if (targetKind === 'mcu' || targetKind === 'stc_mcu' || targetKind === 'stc15_mcu') {
      const terms = new Set([equiv.power, equiv.ground]);
      for (const w of netWires) if (w.from === mcu.id) terms.add(w.fromTerminal);
      q.terminals = [...terms];
    }
    return q;
  });

  const holeInMcuStrip = (e) => e && typeof e === 'object' && e.board
    && mcuStrips.has(`${e.board}:${stripKeyOf(e.hole)}`);
  const wires = (d.wires || []).filter((w) => {
    if (w.from === mcu.id || w.to === mcu.id) return false;
    if ((w.from && w.from.part === mcu.id) || (w.to && w.to.part === mcu.id)) return false;
    if (holeInMcuStrip(w.from) || holeInMcuStrip(w.to)) return false;
    return true;
  }).concat(netWires);

  const holeWires = (d.holeWires || []).filter((hw) =>
    !(mcuStrips.has(`${hw.boardId}:${stripKeyOf(hw.a)}`)
      || mcuStrips.has(`${hw.boardId}:${stripKeyOf(hw.b)}`)));

  const out = { vcc: d.vcc ?? 5, parts, wires, holeWires, generated: 'benchFor+authored' };
  const check = Circuit.fromJSON(out);
  if (check.netlistError) return { ok: false, reason: `transformed circuit rejected: ${check.netlistError}` };
  return { ok: true, out };
}

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
        const t = transformAuthored(data, DEVPART[device], r.pinMap || [], cmod.Circuit, SB3Creator.RETARGET_POOLS[device], device);
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
  let seated = 0, failed = 0;
  for (const f of fs.globSync ? fs.globSync('examples/*/circuit.*.json')
      : require('glob').sync('examples/*/circuit.*.json')) {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (d.parts.some(p => p.seat)) continue;
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
    const outText = execFileSync('node', [seatgen, '--examples',
      `/tmp/wore-batch/${exid}-${device}`, '--only', exid], { encoding: 'utf8' });
    if (outText.includes('seated')) {
      const seatedD = JSON.parse(fs.readFileSync(path.join(scratch, 'circuit.json'), 'utf8'));
      seatedD.generated = d.generated === 'benchFor+authored'
        ? 'benchFor+authored+seat' : 'benchFor+seat';
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
