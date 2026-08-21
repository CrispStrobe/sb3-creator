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
  let resolveTerminal;
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
    ({ resolveTerminal } = await import(join(CUI, 'src/model/terminal-aliases.js')));
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
      const sourceParts = new Map((data.parts || []).map(part => [part.id, part]));
      const endpoint = (wire, side) => {
        const raw = wire[side];
        if (raw && typeof raw === 'object') return raw.board
          ? {board: raw.board, hole: raw.hole}
          : {part: raw.part, terminal: raw.terminal};
        return {part: raw, terminal: wire[`${side}Terminal`]};
      };
      // Before canonical loading can normalize anything, reject references to
      // missing parts/boards. Terminal aliases and legacy omitted terminal
      // arrays are resolved by the canonical loader below.
      for (const wire of data.wires || []) for (const side of ['from', 'to']) {
        const ep = endpoint(wire, side);
        if (ep.board) {
          if (sourceParts.get(ep.board)?.kind !== 'breadboard' || !ep.hole) {
            problems.push(`${rel}: wire ${side} points to missing board/hole ${ep.board || '?'}.${ep.hole || '?'}`);
          }
          continue;
        }
        const part = sourceParts.get(ep.part);
        if (!part) { problems.push(`${rel}: wire ${side} points to missing part ${ep.part || '?'}`); continue; }
        if (!ep.terminal) problems.push(`${rel}: wire ${side} has no terminal on ${ep.part}`);
      }
      for (const jumper of data.holeWires || []) {
        if (sourceParts.get(jumper.boardId)?.kind !== 'breadboard' || !jumper.a || !jumper.b) {
          problems.push(`${rel}: jumper ${jumper.ref || '?'} points into nowhere`);
        }
      }
      let circ;
      try { circ = Circuit.fromJSON(data); } catch (e) { problems.push(`${rel}: loader threw ${e.message}`); continue; }
      // The canonical loader now exposes the rejection explicitly. Check it
      // before looking at the board so one malformed terminal reports the real
      // engine error instead of turning into hundreds of reachability symptoms.
      if (circ.netlistError != null) {
        problems.push(`${rel}: engine rejected the bench (${circ.netlistError})`);
        continue;
      }

      // Keep the non-empty assertion as an independent canary: a future loader
      // could accidentally stop surfacing netlistError while still replacing
      // the board with an empty instance.
      const bparts = (circ.board && circ.board.parts) || [];
      const bnets = (circ.board && circ.board.nets) || [];
      if (!bparts.length) { problems.push(`${rel}: engine rejected the bench (board has no parts)`); continue; }

      // After alias/sidecar resolution, every logical endpoint must appear
      // in an actual resolved electrical net. This is the direct "no wire
      // into nirvana" invariant and still accepts legitimate legacy aliases.
      const boardParts = new Map(bparts.map(part => [part.id, part]));
      for (const wire of data.wires || []) for (const side of ['from', 'to']) {
        const ep = endpoint(wire, side);
        if (ep.board) continue;
        const part = boardParts.get(ep.part);
        const terminal = part ? resolveTerminal(part.kind, ep.terminal, part.terminals || []) : ep.terminal;
        const resolved = bnets.some(net => net.terminals.some(t => t.part === ep.part && t.terminal === terminal));
        if (!resolved) {
          problems.push(`${rel}: wire ${side} ends in nowhere at ${ep.part || '?'}.${ep.terminal || '?'}`);
        }
      }

      // Suppression is required in passive lessons too. Checking this before
      // the MCU reachability early-return closes the blind spot that let
      // hand-authored relay and motor circuits ship without flyback diodes.
      if (!rel.startsWith('33-inductive-no-flyback/') && !rel.startsWith('pc26-motor-clamp/')) {
        for (const load of bparts.filter(p => p.kind === 'dc_motor' || p.kind === 'relay')) {
          const lowTerm = load.kind === 'relay' ? 'coil_b' : 'b';
          const highTerm = load.kind === 'relay' ? 'coil_a' : 'a';
          const low = bnets.find(n => n.terminals.some(t => t.part === load.id && t.terminal === lowTerm));
          const high = bnets.find(n => n.terminals.some(t => t.part === load.id && t.terminal === highTerm));
          const protectedBy = bparts.filter(p => p.kind === 'diode').find(diode =>
            low?.terminals.some(t => t.part === diode.id && t.terminal === 'anode') &&
            high?.terminals.some(t => t.part === diode.id && t.terminal === 'cathode'));
          if (!protectedBy) problems.push(`${rel}: ${load.id} has no correctly oriented flyback diode`);
        }
      }

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
