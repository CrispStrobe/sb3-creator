// Every declared INPUT pin that has a control wired to it must RESPOND to
// that control, through the simulator driver, on the bench the example ships.
//
// WHY THIS EXISTS, AND WHY IT IS CORPUS-WIDE
// -----------------------------------------
// `js-driver-oled-chain.test.mjs` proves this for the 70-calculator's Pico
// keypad, which is the bench whose failure was reported. That gate was written
// as the repair landed, and it passes — while 22 of the corpus's 67 wired
// controls were still dead, because the repair fixed the board-class half of a
// two-family defect and the gate only ever looked at a board-class bench.
//
// The measurement, per arming rule, over every example that ships BOTH a
// `program.bw` with an INPUT pin declaration AND a `circuit.json` with a
// button or switch on that pin's net (33 benches, 67 such pins):
//
//   no arming at all            (before 0777a17)   43 / 67 dead
//   arm with driveHigh=false    (0777a17)          22 / 67 dead
//   arm quasi HIGH              (this commit)       1 / 67 dead
//
// The last one is a real and separate example defect, named in EXPECTED_DEAD
// below rather than tolerated silently.
//
// WHAT "RESPOND" MEANS, and why it is not "reads 0 at rest".
// This gate is deliberately declaration-agnostic: it never assumes which level
// means pressed. `26-debounce` declares `PIN btn = P3.2 INPUT` and inverts in
// the program (`wait until read btn = 0`); `05-counter` declares
// `INPUT ACTIVE LOW` and lets the driver invert. Both are correct, and a gate
// that asserted "an unpressed key reads 0" would have called one of them a
// defect. What no correct bench can do is fail to CHANGE, so that is the
// invariant: operate the control, and the pin must read differently.
//
// Needs the bw-board/bw-circuit-ui checkouts; skips locally, FAILS in CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const EX = join(SB3, 'examples');

const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'the simulator driver control-response sweep');

/**
 * The one bench whose control still cannot respond, with the reason and the
 * owner. `arduino-02-digital-input-pullup` is the Arduino sketch whose whole
 * subject is `pinMode(2, INPUT_PULLUP)`: the button goes to ground and there
 * is no external pull resistor, so the pull has to come from inside the MCU.
 * Its declaration is `PIN btn = D2 INPUT` — active HIGH — which the driver
 * correctly honours as a programmed pull-DOWN, and both sides of the button
 * then sit at 0 V. The fix is the declaration (`INPUT ACTIVE LOW`, which is
 * what INPUT_PULLUP plus button-to-ground means), not the driver, and it
 * changes what the example emits for a real board, so it is a separate change
 * with its own verdict rather than a drive-by edit inside a driver fix.
 *
 * RATCHET: this list may only shrink.
 */
const EXPECTED_DEAD = new Set(['arduino-02-digital-input-pullup:btn']);

const MS = 1000000n;

async function sweep(armDriveHigh) {
  const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
  const { setEngine } = await import(join(CUI, 'src/engine.js'));
  const eng = await import(join(BWB, 'src/index.js'));
  (await import(join(BWB, 'src/register-all.js'))).registerAllDevices();
  setEngine({ BoardImpl: eng.BoardImpl, inferNetlist: eng.inferNetlist, checkWiring: eng.checkWiring });
  const { registerSidecar } = await import(join(CUI, 'src/model/parts-registry.js'));
  for (const f of readdirSync(join(CUI, 'src/parts-data'))) {
    if (!f.endsWith('.json')) continue;
    try {
      const sc = JSON.parse(readFileSync(join(CUI, 'src/parts-data', f), 'utf8'));
      if (sc.kind) registerSidecar(sc);
    } catch { /* bw-parts' problem */ }
  }
  const { Circuit } = await import(join(CUI, 'src/model/circuit.js'));

  // The driver's own mode rule, read off the emitted text rather than restated
  // here, so this gate cannot drift from the thing it measures.
  const modeOf = (p) => (p.dir === 'output' ? 'pushpull'
    : p.dir === 'analog' ? 'input'
      : p.q ? 'quasi' : (p.low ? 'input-pullup' : 'input-pulldown'));

  const dead = [];
  let benches = 0;
  let pins = 0;
  for (const id of readdirSync(EX)) {
    const prog = join(EX, id, 'program.bw');
    const circ = join(EX, id, 'circuit.json');
    if (!existsSync(prog) || !existsSync(circ)) continue;
    let creator;
    try {
      creator = new SB3Creator();
      creator.parse(readFileSync(prog, 'utf8'));
    } catch { continue; }
    const stc = creator.project?.stc;
    if (!stc?.pins?.some((p) => p.direction === 'input')) continue;
    let js;
    try { js = creator.generateJavaScript(undefined, { driver: 'simulator' }); } catch { continue; }
    const m = js.match(/const _stc12_pins = (\{.*?\});/s);
    if (!m) continue;
    const table = JSON.parse(m[1]);
    const data = JSON.parse(readFileSync(circ, 'utf8'));
    let probe;
    try { probe = Circuit.fromJSON(JSON.parse(JSON.stringify(data))); } catch { continue; }
    if (!probe.board?.parts?.length) continue;
    benches++;

    for (const [name, p] of Object.entries(table)) {
      if (p.dir !== 'input') continue;
      const net = probe.board.nets.find((n) => n.terminals.some(
        (t) => String(t.terminal).toLowerCase() === String(p.pin).toLowerCase()));
      if (!net) continue;
      const ctrl = net.terminals
        .map((t) => probe.board.parts.find((x) => x.id === t.part))
        .find((x) => x && (x.kind === 'button' || x.kind === 'switch'));
      if (!ctrl) continue;
      pins++;

      const c = Circuit.fromJSON(JSON.parse(JSON.stringify(data)));
      const b = c.board;
      if (armDriveHigh !== null) {
        for (const q of Object.values(table)) {
          if (q.dir === 'output') continue;
          const mode = modeOf(q);
          try { b.setPin(q.pin, mode, armDriveHigh(mode)); } catch { /* not on this bench */ }
        }
      }
      b.advanceTo(10n * MS);
      const before = !!b.readPin(p.pin);
      c.setControl(ctrl.id, 1);
      b.advanceTo(60n * MS);
      const after = !!b.readPin(p.pin);
      if (before === after) dead.push(`${id}:${name}`);
    }
  }
  return { benches, pins, dead };
}

test('every wired control moves the pin the program reads', { skip: gate.skip }, async () => {
  const { benches, pins, dead } = await sweep((mode) => mode === 'quasi');

  // Denominators, so a shrinking population cannot look like a repair.
  assert.ok(benches >= 33, `${benches} benches swept (expected at least 33)`);
  assert.ok(pins >= 67, `${pins} declared input pins carry a control (expected at least 67)`);

  const unexpected = dead.filter((d) => !EXPECTED_DEAD.has(d));
  assert.deepEqual(unexpected, [],
    `${unexpected.length} of ${pins} wired controls do not move the pin their program reads.\n`
    + 'Operating the control leaves readPin unchanged, so the bench cannot tell pressed from '
    + 'released — the 70-calculator symptom, on a different bench.\n  '
    + unexpected.join('\n  '));

  const fixed = [...EXPECTED_DEAD].filter((d) => !dead.includes(d));
  assert.deepEqual(fixed, [],
    `${fixed.join(', ')} now responds. This ratchet may only shrink: delete the entry from `
    + 'EXPECTED_DEAD in the same commit that fixed it.');
});

test('the arming rail is what fixes it, and each half of the repair is measurable',
  { skip: gate.skip }, async () => {
    // The three rules, so the numbers in this file's header are re-derived
    // rather than asserted, and so a future edit to the arming loop is judged
    // against what it actually does to the corpus.
    const none = await sweep(null);
    const low = await sweep(() => false);
    const rail = await sweep((mode) => mode === 'quasi');

    assert.equal(none.pins, rail.pins, 'the three sweeps see the same population');
    assert.ok(none.dead.length > low.dead.length,
      `arming at all must help: ${none.dead.length} dead unarmed vs ${low.dead.length} armed low`);
    assert.ok(low.dead.length > rail.dead.length,
      'arming a quasi pin at its own idle rail must help again: '
      + `${low.dead.length} dead armed-low vs ${rail.dead.length} armed at the rail`);
    assert.equal(rail.dead.length, EXPECTED_DEAD.size,
      `${rail.dead.length} dead controls remain; EXPECTED_DEAD names ${EXPECTED_DEAD.size}`);
  });
