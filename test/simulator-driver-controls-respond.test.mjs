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
//   arm quasi HIGH              (553a639)           1 / 67 dead
//   the last declaration fixed  (this commit)       0 / 67 dead
//
// The last one was `arduino-02-digital-input-pullup:btn` (D36), and it was an
// EXAMPLE defect rather than a driver one: the sketch it ports is
// `pinMode(2, INPUT_PULLUP)` with the button to ground and no external pull, so
// the pin is ACTIVE LOW — but the example declared `PIN btn = D2 INPUT`, i.e.
// active HIGH, which the driver correctly honours as a programmed pull-DOWN,
// leaving both sides of the button at 0 V. The declaration now says ACTIVE LOW,
// which is what this repo's own C reader already emitted for that sketch
// (`cToPseudocode`, and `ctarget.test.mjs`'s "an Arduino pin is discovered from
// the calls that use it": `PIN button = D2 INPUT ACTIVE LOW`). So the example
// had been contradicting the reader that reads its own source language.
//
// RATCHET, now at zero: EXPECTED_DEAD must stay EMPTY. There is no longer a
// "known dead" tier to add to — a control that stops responding is a failure,
// not a list entry.
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
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine, registerSidecars } from '../scripts/lib/engine-surface.mjs';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const EX = join(SB3, 'examples');

const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'the simulator driver control-response sweep');

/**
 * Benches whose control cannot respond, each with a reason and an owner.
 *
 * EMPTY, and it must stay empty — see the ratchet note in this file's header.
 * The last entry, `arduino-02-digital-input-pullup:btn`, was removed in the
 * commit that repaired its declaration. A new entry here is not a way to land
 * a bench whose control does nothing; it is a way to hide one.
 */
const EXPECTED_DEAD = new Set([]);

const MS = 1000000n;

async function sweep(armDriveHigh) {
  const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
  const { Circuit } = await injectEngine({ board: BWB, cui: CUI });
  await registerSidecars(CUI);

  // The driver's own mode rule, read off the emitted text rather than restated
  // here, so this gate cannot drift from the thing it measures.
  const modeOf = (p) => (p.dir === 'output' ? 'pushpull'
    : p.dir === 'analog' ? 'input'
      : p.q ? 'quasi' : (p.low ? 'input-pullup' : 'input-pulldown'));

  const rawIndex = JSON.parse(readFileSync(join(EX, 'index.json'), 'utf8'));
  const entries = (Array.isArray(rawIndex) ? rawIndex : rawIndex.examples)
    .slice().sort((a, b) => a.id.localeCompare(b.id));

  const dead = [];
  let benches = 0;
  let pins = 0;
  for (const entry of entries) {
    const id = entry.id;
    if (!entry.files?.program || !entry.files?.circuit) continue;
    const prog = join(EX, entry.files.program);
    const circ = join(EX, entry.files.circuit);
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

  // The ratchet reached zero on 2026-08-29 and is pinned there. Re-adding an
  // entry is the failure mode this asserts against: it would let a bench whose
  // control does nothing land as "known", which is how the previous 22 survived
  // a gate that already existed for one of them.
  assert.deepEqual([...EXPECTED_DEAD], [],
    'EXPECTED_DEAD is at zero and may not grow. A control that does not move its '
    + 'pin is a defect in the bench or the driver — fix it, or open a row for it, '
    + 'but do not exempt it here.');
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
    assert.equal(rail.dead.length, 0,
      `${rail.dead.length} dead controls remain, and the corpus is at zero: ${rail.dead.join(', ')}`);
    // The fourth row of this file's table: the last dead control was an example
    // declaration, not an arming rule, so it does not move with `armDriveHigh`.
    // Both armed sweeps see the repaired bench respond.
    assert.ok(!low.dead.includes('arduino-02-digital-input-pullup:btn')
      && !rail.dead.includes('arduino-02-digital-input-pullup:btn'),
    'the D36 bench must respond under either arming rule once its declaration is right');
  });
