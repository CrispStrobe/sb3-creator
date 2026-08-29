// 70-calculator through the SIMULATOR-DRIVER chain: blocks →
// generateJavaScript({driver:'simulator'}) → vm sandbox with the REAL
// board attached → ssd1306 decode.
//
// pico-oled-chain.test.mjs proves the C/rp2040js path; THIS file proves
// the path the app's Run button actually executes. It pins the two bugs
// found on 2026-08-17:
//   1. The devices ops table had no oled entries, so the JS generator
//      emitted every oled op as a COMMENT — the in-app OLED stayed black
//      on every device while the silicon path worked.
//   2. The simulator pin table spelled board-class pins as
//      P<port>.<bit> with no port defined — "Pundefined.undefined" —
//      so every setPin landed on a pin the board does not have.
//   3. (2026-08-25) Board-class INPUT pins were mapped to "quasi" — the
//      8051 weak PULL-UP — and nothing ever configured a read-only pin,
//      so every Pico key net floated ~2.1 V and read pressed from boot;
//      the firmware's scan reported its first-declared key ("9")
//      forever. Inputs now arm per board instance with the programmed
//      pull (activeLow → input-pullup, else input-pulldown), matching
//      the MicroPython backend's Pin.PULL_* rule.
//
// Needs the bw-board/bw-circuit-ui checkouts; skips loudly without them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine, registerSidecars } from '../scripts/lib/engine-surface.mjs';
import vm from 'node:vm';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');

// Cross-repo guard: skip locally, FAIL in CI. CI checks both siblings out at the
// revisions pinned in test/fixtures/siblings.json, so an absent sibling there means
// the checkout step broke and this gate just went silent — see
// test/CROSS-REPO-GATE-AUDIT.md and test/helpers/siblings.mjs.
const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'the JS simulator-driver OLED chain');

test('70-calculator through the JS simulator driver: the OLED lights',
  { skip: gate.skip },
  async () => {
    // 1. blocks → simulator-driver JavaScript
    const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
    const src = readFileSync(join(SB3, 'examples/70-calculator/program.bw'), 'utf8');
    const creator = new SB3Creator();
    creator.parse(src);
    const js = creator.generateJavaScript(undefined, { driver: 'simulator' });
    // The two regressions, asserted at the text level first:
    assert.ok(!/^\s*\/\/ oled /m.test(js), 'no oled op is emitted as a comment');
    assert.ok(!/Pundefined/.test(js), 'board-class pins are spelled by their terminal name');
    assert.match(js, /"sda":\{"pin":"gp0"/, 'sda resolves to the Pico terminal');

    // 2. bench → board (identical bring-up to pico-oled-chain.test.mjs)
    const { Circuit } = await injectEngine({ board: BWB, cui: CUI });
    await registerSidecars(CUI);
    const circ = Circuit.fromJSON(JSON.parse(
      readFileSync(join(SB3, 'examples/70-calculator/circuit.json'), 'utf8')));
    // `netlistError` was removed from the Circuit model, so this used to
    // assert undefined === null and could never pass — failing for a reason
    // that had nothing to do with the bench. Worse, it MASKED the real
    // problem: Circuit._syncNetlist swallows engine rejection in a bare
    // catch, so a bench that the engine refuses still yields a Circuit that
    // looks fine and a board with nothing in it. Assert what actually
    // matters — the board received the netlist.
    assert.ok(circ.board && circ.board.parts.length > 0 && circ.board.nets.length > 0,
        'engine accepts the bench (board got parts and nets; a rejected netlist '
        + 'is swallowed by Circuit._syncNetlist and leaves the board empty)');
    const board = circ.board;

    // 3. run the generated JS with the board attached. The program's
    // FOREVER loops make the vm timeout the normal exit — the draw we
    // assert on happens before the first loop iteration.
    let sdaEdges = 0;
    const origSetPin = board.setPin.bind(board);
    board.setPin = (pin, mode, drive) => {
      if (String(pin).toLowerCase() === 'gp0') sdaEdges++;
      return origSetPin(pin, mode, drive);
    };
    const sandbox = {
      bwBoard: board,
      console: { log: () => {}, error: () => {}, warn: () => {}, info: () => {} },
      prompt: () => ''
    };
    try {
      vm.runInNewContext(js, sandbox, { timeout: 8000 });
    } catch (e) {
      if (e.code !== 'ERR_SCRIPT_EXECUTION_TIMEOUT' && !/timed out/i.test(e.message)) throw e;
    }

    // 4. the panel decoded a real init and a real draw from the wire
    // The driver batches transactions through Board#i2cInject (one MNA
    // solve per EDGE made a display clear cost ~29k solves) and keeps a
    // visible pulse per transaction — so the pin still proves the driver
    // reaches the REAL board, at transaction rate rather than bit rate.
    assert.ok(sdaEdges > 20, `SDA pulses at the board (${sdaEdges} events)`);
    const oled = circ.parts.find((p) => p.kind === 'ssd1306');
    const st = board.getDeviceState(oled.id);
    assert.equal(st.displayOn, true, 'SSD1306 received its bring-up (charge pump + display on)');
    const lit = st.fb.reduce((a, b) => a + (b ? 1 : 0), 0);
    assert.ok(lit >= 20, `framebuffer carries the header (${lit} non-zero bytes)`);

    // 5. the keypad reads honestly (bug 3). Text level first: a Pico
    // INPUT pin must arm a pull-down, never the 8051 quasi pull-up.
    assert.match(js, /input-pulldown/, 'board-class inputs map to input-pulldown');
    // The driver armed the pins during the run; at rest every key reads 0.
    for (const gp of ['gp2', 'gp8', 'gp16']) {
      assert.equal(board.readPin(gp), 0, `${gp} reads 0 at rest (pull-down holds the net)`);
    }
    // Press "5" (k_b5 → GP8): ONLY its pin goes high. The old defect made
    // every key read 1 always, so this is the discriminating assertion —
    // gp2 ("9", first declared) must stay LOW while gp8 reads the press.
    board.setControl('k_b5', 1);
    assert.equal(board.readPin('gp8'), 1, 'pressed key reads 1');
    assert.equal(board.readPin('gp2'), 0, 'unpressed "9" stays 0 while "5" is held');
    board.setControl('k_b5', 0);
    assert.equal(board.readPin('gp8'), 0, 'released key falls back to 0');
  });
