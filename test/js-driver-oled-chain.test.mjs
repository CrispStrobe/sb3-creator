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
//
// Needs the bw-board/bw-circuit-ui checkouts; skips loudly without them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import vm from 'node:vm';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');

const available = existsSync(join(CUI, 'src', 'model', 'circuit.js'))
  && existsSync(join(BWB, 'src', 'index.js'));

test('70-calculator through the JS simulator driver: the OLED lights',
  { skip: available ? false : 'needs bw-circuit-ui/bw-board checkouts beside this repo' },
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
    const circ = Circuit.fromJSON(JSON.parse(
      readFileSync(join(SB3, 'examples/70-calculator/circuit.json'), 'utf8')));
    assert.equal(circ.netlistError, null, 'engine accepts the bench');
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
    assert.ok(sdaEdges > 100, `SDA toggles at the board (${sdaEdges} events)`);
    const oled = circ.parts.find((p) => p.kind === 'ssd1306');
    const st = board.getDeviceState(oled.id);
    assert.equal(st.displayOn, true, 'SSD1306 received its bring-up (charge pump + display on)');
    const lit = st.fb.reduce((a, b) => a + (b ? 1 : 0), 0);
    assert.ok(lit >= 20, `framebuffer carries the header (${lit} non-zero bytes)`);
  });
