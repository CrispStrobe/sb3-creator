// 76-multimeter through the REAL chain: blocks → generateC → sdcc →
// emu8051 (STC15 model) → board MNA → digit decode. This is the
// EXPECTED-value discipline: trace-diff suites compare wrong-to-wrong,
// so magnitude bugs (the 16-bit `raw * 5000` wrap) only ever fall to a
// test that asserts the ABSOLUTE reading on the display.
//
// Needs sdcc on PATH, the emu8051-stc WASM build, and a bw-circuit-ui
// checkout — all three are development-machine tools, so the whole file
// SKIPS (loudly) when one is missing rather than failing CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const EMU_JS = process.env.EMU8051_JS
  // One `..` from sb3-creator, not two: the sibling checkouts (bw-board,
  // bw-circuit-ui, emu8051-stc) all live beside this repo, and every other
  // path in this file already assumes that. The extra level pointed at
  // ~/emu8051-stc, which does not exist, so `available` was false forever
  // and BOTH tests below silently skipped — reporting "skipped 2" rather
  // than "needs a build", which reads as a deliberate exclusion.
  || join(SB3, '..', 'emu8051-stc', 'build', 'emu8051.js');

function sdccAvailable() {
  try { execSync('sdcc --version', { stdio: 'pipe' }); return true; } catch { return false; }
}
const available = sdccAvailable() && existsSync(EMU_JS)
  && existsSync(join(CUI, 'src', 'model', 'circuit.js'))
  && existsSync(join(BWB, 'src', 'emu8051-adapter.js'));

test('49-lcd-hello: the I2C LCD shows its text through the full chain',
  { skip: available ? false : 'needs sdcc + emu8051-stc build + bw-circuit-ui/bw-board checkouts' },
  async () => {
    // The bug this guards: the bench generator retargeted even to the
    // example's AUTHORED device, canonicalizing sda/scl from P2.1/P2.2
    // to pool-order P1.0/P1.1 — the app then paired the bench with the
    // authored program and the bus was wired to pins the firmware never
    // drives. Every wire present, LCD dark (owner report 2026-08-17).
    // Only an absolute display-content check catches a pairing bug.
    const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
    const src = readFileSync(join(SB3, 'examples/49-lcd-hello/program.bw'), 'utf8');
    const creator = new SB3Creator();
    creator.parse(src);
    assert.deepEqual(creator.warnings, [], 'program parses clean');
    const scratch = mkdtempSync(join(tmpdir(), 'bw-lcd-'));
    writeFileSync(join(scratch, 'main.c'), creator.generateC(undefined, {}));
    execSync(`sdcc -mmcs51 --iram-size 256 --xram-size 1024 -o ${join(scratch, 'main.ihx')} ${join(scratch, 'main.c')}`,
      { stdio: 'pipe' });
    const hex = readFileSync(join(scratch, 'main.ihx'), 'utf8');

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
      readFileSync(join(SB3, 'examples/49-lcd-hello/circuit.stc12c5a60s2.json'), 'utf8')));
    // netlistError no longer exists on Circuit; assert what does — a bench the
    // engine refuses is swallowed by _syncNetlist and leaves the board empty.
    assert.ok(circ.board && circ.board.parts.length > 0 && circ.board.nets.length > 0,
        'engine accepts the bench (board got parts and nets)');

    const createEmu = (await import(EMU_JS)).default;
    const Module = await createEmu();
    const { createEmu8051Adapter } = await import(join(BWB, 'src/emu8051-adapter.js'));
    const adapter = createEmu8051Adapter(Module, {
      part: 'stc12c5a60s2', fosc: 11059200, vcc: 5.0, ports: [2],
    });
    adapter.loadHex(hex);
    adapter.attachBoard(circ.board);
    adapter.runNs(500_000_000);

    const lcdId = circ.parts.find(p => p.kind === 'char_lcd_i2c').id;
    const st = circ.board.getDeviceState(lcdId);
    assert.equal(st.display[0], 'HI BRICKWRIGHT  ', 'line 1');
    assert.equal(st.display[1].startsWith('COUNT: '), true, 'line 2 counts');
  });

test('76-multimeter: full-chain EXPECTED values (V, A, T-degC, wrap)',
  { skip: available ? false : 'needs sdcc + emu8051-stc build + bw-circuit-ui/bw-board checkouts' },
  async () => {
    // 1. blocks → C → hex
    const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
    const src = readFileSync(join(SB3, 'examples/76-multimeter/program.bw'), 'utf8');
    const creator = new SB3Creator();
    creator.parse(src);
    assert.deepEqual(creator.warnings, [], 'program parses clean');
    const scratch = mkdtempSync(join(tmpdir(), 'bw-mm-'));
    writeFileSync(join(scratch, 'main.c'), creator.generateC(undefined, {}));
    execSync(`sdcc -mmcs51 --iram-size 256 --xram-size 1024 -o ${join(scratch, 'main.ihx')} ${join(scratch, 'main.c')}`,
      { stdio: 'pipe' });
    const hex = readFileSync(join(scratch, 'main.ihx'), 'utf8');

    // 2. circuit → board (sidecars bulk-loaded like seat-examples.mjs)
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
      readFileSync(join(SB3, 'examples/76-multimeter/circuit.json'), 'utf8')));
    // netlistError no longer exists on Circuit; assert what does — a bench the
    // engine refuses is swallowed by _syncNetlist and leaves the board empty.
    assert.ok(circ.board && circ.board.parts.length > 0 && circ.board.nets.length > 0,
        'engine accepts the bench (board got parts and nets)');
    const board = circ.board;

    // 3. emulator (STC15 part model) + adapter
    const createEmu = (await import(EMU_JS)).default;
    const Module = await createEmu();
    const { createEmu8051Adapter } = await import(join(BWB, 'src/emu8051-adapter.js'));
    const adapter = createEmu8051Adapter(Module, {
      part: 'stc15f2k60s2', fosc: 11059200, vcc: 5.0, ports: [0, 1, 2, 3, 5],
    });
    adapter.loadHex(hex);
    adapter.attachBoard(board);

    // 4. digit decode — segment patterns, 10 digits + the minus glyph
    const SEG_TO_CHAR = new Map([
      ['abcdef', '0'], ['bc', '1'], ['abdeg', '2'], ['abcdg', '3'], ['bcfg', '4'],
      ['acdfg', '5'], ['acdefg', '6'], ['abc', '7'], ['abcdefg', '8'], ['abcdfg', '9'],
      ['g', '-'], ['', ' '],
    ]);
    const decode = () => {
      const digs = board.sevenSeg3Brightness('dis1');
      let out = '', dp = -1;
      digs.forEach((m, i) => {
        const lit = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].filter(s => m[s] > 0.05).join('');
        out += SEG_TO_CHAR.get(lit) ?? '?';
        if (m.dp > 0.05) dp = i;
      });
      return { text: out, dp };
    };
    const runMs = ms => adapter.runNs(ms * 1_000_000);
    const press = () => {
      board.setControl('btn1', 1); runMs(80);
      board.setControl('btn1', 0); runMs(120);
    };

    // 5. the EXPECTED values — absolute readings, not trace identity
    board.setControl('vsrc1', 0.6);
    board.setControl('load1', 0.5);
    runMs(1500);
    assert.deepEqual(decode(), { text: '283', dp: 0 }, 'mode V, pot 60% → 2.83');
    board.setControl('vsrc1', 0.9);
    runMs(600);
    assert.deepEqual(decode(), { text: '439', dp: 0 }, 'mode V, pot 90% → 4.39');

    press(); runMs(600);
    assert.deepEqual(decode(), { text: '067', dp: -1 }, 'mode A → 67 mA');

    press(); runMs(600);
    // T mode: piecewise B-equation (B=3950, 10k@25C). Engine NTC control
    // 0..1 maps R 100k → 1k; float truths -19.2 / 1.2 / 25.0 / 53.4 / 87.7 °C.
    assert.deepEqual(decode(), { text: '-19', dp: -1 }, 'ntc control 0 → -19 °C');
    for (const [c, want, label] of [
      [0.25, { text: '010', dp: 1 }, '1.0 °C'],
      [0.5, { text: '250', dp: 1 }, '25.0 °C'],
      [0.75, { text: '536', dp: 1 }, '53.6 °C'],
      [1.0, { text: '879', dp: 1 }, '87.9 °C'],
    ]) {
      board.setControl('ntc1', c);
      runMs(600);
      assert.deepEqual(decode(), want, `ntc control ${c} → ${label}`);
    }
    board.setControl('ntc1', 0);

    press(); runMs(600);
    assert.deepEqual(decode(), { text: '439', dp: 0 }, 'third press wraps to mode V');
  });
