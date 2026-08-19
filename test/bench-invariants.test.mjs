// Bench invariants — the "do not break circuits that once worked" gate.
//
// Every shipped device bench must satisfy structural truths through the
// CANONICAL loader, whatever generator wrote it. These invariants would
// have caught, at commit time, each of the bench regressions the owner
// had to find in the app instead: the disconnected staging (every
// peripheral unreachable), the unseated restamp (seats claimed, none
// present), and the ghost-terminal netlist rejections.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const EXAMPLES = join(SB3, 'examples');

const available = existsSync(join(CUI, 'src', 'model', 'circuit.js'))
  && existsSync(join(BWB, 'src', 'index.js'));

// Kinds that legitimately sit outside the MCU's reach.
const STRUCTURAL = new Set(['breadboard', 'vcc', 'gnd']);
// The MCU-surface kinds a bench pivots on.
const MCU_KINDS = new Set(['mcu', 'stc_mcu', 'stc15_mcu', 'arduino_uno', 'arduino_nano',
  'arduino_mega', 'pi_pico', 'attiny85', 'attiny88']);

describe('bench invariants: every device bench, canonical loader', { skip: available ? false : 'needs bw-circuit-ui/bw-board checkouts' }, () => {
  let Circuit;
  test('engine + sidecars load', async () => {
    const { setEngine } = await import(join(CUI, 'src/engine.js'));
    const eng = await import(join(BWB, 'src/index.js'));
    (await import(join(BWB, 'src/register-all.js'))).registerAllDevices();
    setEngine({ BoardImpl: eng.BoardImpl, inferNetlist: eng.inferNetlist,
      checkWiring: eng.checkWiring, hasDevice: eng.hasDevice });
    const { registerSidecar } = await import(join(CUI, 'src/model/parts-registry.js'));
    for (const f of readdirSync(join(CUI, 'src/parts-data'))) {
      if (!f.endsWith('.json')) continue;
      try {
        const sc = JSON.parse(readFileSync(join(CUI, 'src/parts-data', f), 'utf8'));
        if (sc.kind) registerSidecar(sc);
      } catch { /* bw-parts' problem */ }
    }
    ({ Circuit } = await import(join(CUI, 'src/model/circuit.js')));
  });

  const benchFiles = [];
  for (const dir of readdirSync(EXAMPLES, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const f of readdirSync(join(EXAMPLES, dir.name))) {
      // The device-suffixed benches AND the primary circuit.json. The suffix
      // pattern alone skipped every example's default bench — 215 files, the
      // ones the app actually opens first — so a bench could be broken in the
      // one circuit users see and this gate would never look at it.
      if (/^circuit\.[\w-]+\.json$/.test(f) || f === 'circuit.json') benchFiles.push(join(dir.name, f));
    }
  }

  test(`all ${benchFiles.length} benches: engine accepts, peripherals reachable from the MCU`, () => {
    const problems = [];
    for (const rel of benchFiles) {
      const data = JSON.parse(readFileSync(join(EXAMPLES, rel), 'utf8'));
      let circ;
      try { circ = Circuit.fromJSON(data); } catch (e) { problems.push(`${rel}: loader threw ${e.message}`); continue; }
      // Circuit.netlistError and Circuit.resolvedNets NO LONGER EXIST — both
      // were removed from bw-circuit-ui's model. Reading them made this gate
      // vacuous in the worst way: resolvedNets came back undefined for all 819
      // benches, so every part was trivially unreachable and the suite reported
      // 3288 violations. A gate that fails wholesale cannot report anything, and
      // a REAL "every peripheral unreachable" regression — the exact thing this
      // file was written to catch — would have been indistinguishable from the
      // noise. The engine's own view lives on circ.board.
      //
      // An empty board is the load failure: Circuit._syncNetlist swallows engine
      // rejection in a bare catch, so a refused bench still yields a healthy
      // looking Circuit attached to a board holding nothing.
      const bparts = (circ.board && circ.board.parts) || [];
      const bnets = (circ.board && circ.board.nets) || [];
      if (!bparts.length) { problems.push(`${rel}: engine rejected the bench (board has no parts)`); continue; }

      // A device-suffixed bench NAMES a chip, so a missing MCU is a real
      // defect. The primary circuit.json need not have one at all: the gallery
      // ships passive examples (vsource|resistor|led, RC charge, diode
      // polarity) whose whole point is that there is no microcontroller.
      // Flagging those was a false positive introduced by widening the file
      // set — 110 of them — and the MCU-reachability invariant simply does not
      // apply where there is no MCU to reach from.
      const mcu = bparts.find((p) => MCU_KINDS.has(p.kind));
      if (!mcu) {
        if (rel.endsWith('circuit.json')) continue;   // passive bench: not applicable
        problems.push(`${rel}: no MCU part`);
        continue;
      }

      // Reachability over resolved nets: every non-structural part must
      // connect (transitively) to the component that contains the MCU.
      const adj = new Map();
      const link = (x, y) => {
        if (!adj.has(x)) adj.set(x, new Set());
        if (!adj.has(y)) adj.set(y, new Set());
        adj.get(x).add(y); adj.get(y).add(x);
      };
      for (const n of bnets) {
        const ids = [...new Set(n.terminals.map((t) => t.part))];
        for (let i = 1; i < ids.length; i++) link(ids[0], ids[i]);
      }
      const seen = new Set([mcu.id]);
      const queue = [mcu.id];
      while (queue.length) {
        for (const nb of adj.get(queue.shift()) || []) {
          if (!seen.has(nb)) { seen.add(nb); queue.push(nb); }
        }
      }
      for (const p of bparts) {
        if (STRUCTURAL.has(p.kind) || p.id === mcu.id) continue;
        if (!seen.has(p.id)) problems.push(`${rel}: ${p.id} (${p.kind}) unreachable from the MCU`);
      }

      // An MCU GPIO directly in a power net is a SHORT: the Pico's SWD
      // pads seated at dRow 3 landed INSIDE the top-block strips and
      // grounded gp7 through the breadboard itself — key b4 read
      // pressed-to-rail (peer probe, 2026-08-17). Power flows to GPIOs
      // through PARTS (buttons, resistors, switches), never bare.
      for (const n of bnets) {
        const power = n.terminals.filter((t) => {
          const pp = bparts.find((x) => x.id === t.part);
          return pp && (pp.kind === 'vcc' || pp.kind === 'gnd');
        });
        if (!power.length) continue;
        const gpios = n.terminals.filter((t) => t.part === mcu.id
          && /^(gp\d+|p\d+\.\d+|d\d+|a\d+)$/i.test(t.terminal));
        for (const g of gpios) {
          problems.push(`${rel}: MCU ${g.terminal} shorted into a power net`);
        }
      }

      // A button whose two legs share a net is permanently pressed.
      for (const p of bparts) {
        if (p.kind !== 'button') continue;
        const netOf = (term) => bnets.find(
          (n) => n.terminals.some((t) => t.part === p.id && t.terminal === term));
        const na = netOf('a'); const nb = netOf('b');
        if (na && nb && na === nb) problems.push(`${rel}: button ${p.id} shorted (both legs on one strip)`);
      }
    }
    assert.deepEqual(problems, [], `${problems.length} bench invariant violations`);
  });
});
