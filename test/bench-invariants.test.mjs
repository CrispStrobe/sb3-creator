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
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine, registerSidecars } from '../scripts/lib/engine-surface.mjs';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const EXAMPLES = join(SB3, 'examples');

// Cross-repo guard: skip locally, FAIL in CI. CI checks both siblings out at the
// revisions pinned in test/fixtures/siblings.json, so an absent sibling there means
// the checkout step broke and this gate just went silent — see
// test/CROSS-REPO-GATE-AUDIT.md and test/helpers/siblings.mjs.
const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'bench invariants');

/**
 * Endpoints that name a terminal the engine and the catalog both deny.
 *
 * MEASURED 2026-08-29 at bw-board 4ae89b5 + bw-circuit-ui 14efc75: the whole
 * corpus is 2162 circuit files and 55561 wire endpoints, and there were TWO.
 * It may only SHRINK — and it has, to nothing.
 *
 * BOTH ENTRIES WERE `mcu1.P4.7`, one per 60-retro-console variant, and they
 * were held open as a question rather than a defect: P4.7 exists on the
 * STC12C5A60S2 (PDIP-40 pin 9) but that pin is RST by default and becomes
 * GPIO only under `P4SW`, so bw-circuit-ui's generic `mcu` catalog names pin
 * 9 `RST` and offers P4.4/P4.5/P4.6 only. The note here recorded the reason
 * for not resolving it: a blind `P4.7 -> RST` terminal alias would have
 * moved a live output onto the reset pin.
 *
 * CLOSED 2026-08-31 by MEASUREMENT, not by choosing a name. Driven through
 * the engine on the shipped bench, a fresh board per drive, volts at
 * r1.a / q1.base / q1.collector (the 1 kOhm into the buzzer PNP's base):
 *
 *   nothing driven                  4.990020 / 4.990020 / 0.000000
 *   setPin('P4.7', pushpull, LOW)   0.103865 / 4.258454 / 4.795205
 *   setPin('P4.7', pushpull, HIGH)  5.000000 / 5.000000 / 0.000000
 *   setPin('RST',  pushpull, any)   4.990020 / 4.990020 / 0.000000
 *   setPin('ZZ.NOPE', any)          4.990020 / 4.990020 / 0.000000
 *
 * The engine modelled that pin as a drivable GPIO all along, under the
 * spelling `P4.7` and only that one — `RST` was bit-identical to the
 * nonexistent-terminal control. The 8051 adapter emits `P${port}.${bit}`, so
 * `P4.7` is also what firmware writes to P4^7 produce. And the bench means
 * GPIO there: circuit.json drives the same PNP from P5.5 on an stc15_mcu
 * and the program declares `PIN buzzer = P5.5 OUTPUT ACTIVE LOW`, so P4.7 is
 * the STC12 retarget of an output. Renaming the wire to RST would have
 * silenced the buzzer, which is what the table above would have measured.
 *
 * The repair went where names live: bw-board `3160a10` declares pin 9's two
 * datasheet names as one pin (unique match — the alias fires only when the
 * part declares exactly one of the pair, so it can never merge terminals a
 * netlist kept apart), and `338ac5d` exports that surface so this gate can
 * ASK rather than re-declare. The authority check below consults it.
 *
 * The list stays, empty, as the ratchet: a genuinely invented terminal still
 * reddens this gate, and the empty set is asserted so the check cannot be
 * quietly widened again.
 */
const INVENTED_TERMINALS = new Set([]);

// Kinds that legitimately sit outside the MCU's reach.
const STRUCTURAL = new Set(['breadboard', 'vcc', 'gnd']);
// The MCU-surface kinds a bench pivots on.
const MCU_KINDS = new Set(['mcu', 'stc_mcu', 'stc15_mcu', 'arduino_uno', 'arduino_nano',
  'arduino_mega', 'pi_pico', 'attiny85', 'attiny88', 'stm32f030']);

describe('bench invariants: every device bench, canonical loader', { skip: gate.skip }, () => {
  let Circuit;
  let resolveTerminal, engineTerminals, terminalsForKind;
  // The engine's dual-function pin table (bw-board 338ac5d). Taken from the
  // ENGINE namespace, not re-declared here: a copy of the pair would drift
  // from the one the solver drives through, and the whole point of asking is
  // that names are the engine's to own.
  let dualFunctionAlias;
  test('engine + sidecars load', async () => {
    // getDevice, not hasDevice. bw-circuit-ui's engineKindFor asks the injected
    // engine whether a passthrough kind has a registered model, and the name it
    // asks for is `getDevice` — `engine.js` has never documented a `hasDevice`.
    // Injecting only hasDevice here made this gate prove the feature against an
    // engine the app does not build: a 28c256 kept its identity under THIS test
    // while production collapsed it to a generic 'mcu' (bw-circuit-ui fbe7338).
    // With the fix in, the inversion came out the other way and this file was
    // the one that went red: pc112/pc113/pc117/pc118 place two 28c256 ROMs,
    // the first collapsed one was picked up by MCU_KINDS as "the MCU", and its
    // address lines tied to the rails read as 32 GPIO-to-power shorts. The
    // injected surface has to be the one the app injects, or the gate is
    // answering a question nobody asked — which is now enforced rather than
    // restated: injectEngine() applies ENGINE_SURFACE and nothing else, and it
    // wraps getDevice the way circuit-tab.jsx does (stc_mcu answers null).
    const injected = await injectEngine({ board: BWB, cui: CUI });
    ({ Circuit } = injected);
    ({ dualFunctionAlias } = injected.board);
    assert.equal(typeof dualFunctionAlias, 'function',
      'bw-board no longer exports dualFunctionAlias — without it the authority ' +
      'check below cannot tell a datasheet-true second spelling from an ' +
      'invented terminal, and would silently start reporting the first as the ' +
      'second (that is exactly the P4.7/RST finding this gate carried open)');
    const sidecars = await registerSidecars(CUI);
    // MEASURED FLOOR. Without one, a parts-data directory that moved or emptied
    // registers nothing, every terminal alias falls back to its raw name, and
    // the reachability invariant below quietly stops resolving the aliases it
    // exists to accept. bw-circuit-ui d754cfc ships 239 sidecars.
    assert.ok(sidecars >= 200,
      `only ${sidecars} part sidecars registered from ${join(CUI, 'src/parts-data')} ` +
      '(expected ~239) — the alias surface this gate resolves against is not loaded');
    ({ resolveTerminal } = await import(join(CUI, 'src/model/terminal-aliases.js')));
    ({ engineTerminals } = await import(join(CUI, 'src/engine.js')));
    ({ terminalsForKind } = await import(join(CUI, 'src/model/circuit.js')));
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

  // THE RATCHET, asserted rather than described. The exception list reached
  // empty on 2026-08-31 and may never grow again: any future endpoint the
  // catalog denies is either a real defect or a real dual-function pin, and
  // the second belongs in bw-board's table where the solver can see it, not
  // in a per-file waiver here.
  test('the invented-terminal exception list is empty and stays empty', () => {
    assert.deepEqual([...INVENTED_TERMINALS], [],
      'a new waiver was added instead of fixing the bench or teaching the ' +
      'engine the pin — see the P4.7/RST measurement at the top of this file');
  });

  // VACUITY FLOOR, and it is not decoration. This whole file's verdict is
  // `assert.deepEqual(problems, [])` over a list built by walking a directory —
  // the single shape that reports a clean run over a corpus it never opened.
  // Empty `examples/`, or narrow the filename test by one character, and every
  // invariant below passes having examined nothing, under a test NAME that
  // truthfully says "all 0 benches" and that nobody reads.
  //
  // That is not hypothetical here: finding #4 of test/GATE-AUDIT-REPORT.md was
  // this exact regex matching only the device-suffixed files, so 215 primary
  // benches — the ones the app opens first — went unchecked while the gate
  // stayed green. The floors are split so the same mistake cannot recur
  // silently: a total alone would still be met by the 870 suffixed files.
  //
  // MEASURED 2026-08-23: 1092 bench files over 275 example directories —
  // 222 primary `circuit.json` and 870 device-suffixed. Floors sit ~10% under.
  test('the bench corpus is actually there', () => {
    const primary = benchFiles.filter((r) => r.endsWith('circuit.json')).length;
    const suffixed = benchFiles.length - primary;
    assert.ok(benchFiles.length >= 1000,
      `only ${benchFiles.length} bench files found under ${EXAMPLES} (expected ~1092) — ` +
      'this gate is about to report a clean run over a corpus it did not open');
    assert.ok(primary >= 200,
      `only ${primary} primary circuit.json benches found (expected ~222) — the file ` +
      'set narrowed to the device-suffixed benches again; that was finding #4');
    assert.ok(suffixed >= 800,
      `only ${suffixed} device-suffixed benches found (expected ~870)`);
  });

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
        // CASE-BLIND, because the engine is. bw-board's setPin says it in the
        // code — "the solver joins case-blind, the UI shows what the caller
        // wrote" — and the netlist stores the author's spelling, which need not
        // be the device model's. bw-board's stc15_mcu declares BOTH `P0.0` and
        // `p0.0` in one terminal list; once bw-circuit-ui fbe7338 let that kind
        // keep its identity instead of collapsing to a generic 'mcu',
        // resolveTerminal started returning the uppercase spelling while the
        // resolved nets carry the lowercase one, and this line reported 120
        // wires "ending in nowhere" across 76-multimeter, 60-retro-console and
        // 61-console-pong — every one of them case-only, every one of those
        // benches solving correctly (76-multimeter's LM358 stage measures to
        // five decimals either side of the pin bump). A gate that reads a
        // spelling difference as a disconnection is reporting on the string,
        // not the circuit. It still catches a terminal that is genuinely in no
        // net at all.
        const lower = String(terminal).toLowerCase();
        const resolved = bnets.some(net => net.terminals.some(t =>
          t.part === ep.part && String(t.terminal).toLowerCase() === lower));
        if (!resolved) {
          problems.push(`${rel}: wire ${side} ends in nowhere at ${ep.part || '?'}.${ep.terminal || '?'}`);
        }

        // THE SECOND CHECK, and the one with the teeth. The line above cannot
        // see an INVENTED terminal: inferNetlist adds a wire endpoint to its
        // net verbatim, so a terminal that exists nowhere joins the net it was
        // invented on. Renaming `r1.a` to `r1.zz` in avr01-blink gives the net
        // `led1.cathode, r1.a, r1.zz`, netlistError null, and the assertion
        // above green — measured, and true before this file was made
        // case-blind as well, so the relaxation cost nothing that was there.
        //
        // The obvious strengthening — "the endpoint must be in the loaded
        // part's terminal list" — is the WRONG rule, and that too is measured:
        // it reports 574 endpoints across 167 files, almost all of them a
        // board kind's power pin (mcu.VCC 130, stc15_mcu.VCC 82, attiny88.avcc
        // 50, arduino_nano.5v 46, pi_pico.vbus 46...). Those files are
        // UNDER-DECLARED, not wrong: aa87c81 measured that class and left it
        // deliberately, because board-kind power drives are built in init()
        // from the MODEL's terminal list and protected by _staticDrives, so a
        // nano bench reads rail-t+ = 5.0000 with only `d13` declared.
        //
        // So the authority is the ENGINE's terminal list for the kind (the
        // catalog when the engine has no model), not the file's saved array.
        // That distinguishes exactly the right two things: `nano1.5v` is a pin
        // the model HAS and the file forgot to list, while `r1.zz` is a pin
        // nothing has. Measured across the whole corpus at the pinned pair:
        // 2162 files, 55561 endpoints, TWO offenders.
        const authority = (() => {
          try {
            const eng = engineTerminals(part.kind, part.params);
            if (Array.isArray(eng) && eng.length) return eng;
            const cat = terminalsForKind(part.kind, part.params);
            if (Array.isArray(cat) && cat.length) return cat;
          } catch { /* no opinion */ }
          return part.terminals || [];
        })();
        const authResolved = resolveTerminal(part.kind, ep.terminal, authority);
        const authLower = String(authResolved).toLowerCase();
        // A dual-function package pin has TWO datasheet names for one
        // physical pin, and the catalog carries one of them. The ENGINE owns
        // names — it is what a drive is addressed to — so ask it rather than
        // re-declaring the pair here, where a copy would drift from the one
        // the solver uses. This is what closed the P4.7/RST question above;
        // it accepts a spelling the catalog omits, never a pin nothing has.
        const alias = dualFunctionAlias(authLower);
        const known = (n) => n !== undefined &&
          authority.some(t => String(t).toLowerCase() === n);
        if (!known(authLower) && !known(alias)) {
          const key = `${rel}:${ep.part}.${ep.terminal}`;
          if (!INVENTED_TERMINALS.has(key)) {
            problems.push(`${rel}: wire ${side} names ${ep.part}.${ep.terminal}, which no ` +
              `${part.kind} has (engine/catalog offers ${authority.length} terminals)`);
          }
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
