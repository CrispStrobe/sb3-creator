// 70-calculator on the Pico through the REAL chain: retarget → generateC →
// arm-none-eabi-gcc (SRAM image) → rp2040js → board MNA → ssd1306 decode.
//
// This is the test that found TWO shipping bugs on 2026-08-17:
//   1. gen-device-benches' seat wrapper assumed nets-form benches and
//      staged every wires-form (authored-transform) bench with ZERO
//      wires — the calculator bench shipped as a disconnected parts
//      list, and the firmware bit-banged perfect I2C into a bus that
//      did not exist.
//   2. The AVR/ARM C flavors emitted the full bit-banged OLED DRIVER but
//      never the SSD1306 bring-up (charge pump, display-on) — the panel
//      sat in its power-on state decoding GDDRAM writes with the display
//      off. True on real silicon too, not an emulator artifact.
//
// Needs arm-none-eabi-gcc and the bw-board/bw-circuit-ui checkouts; the
// whole file SKIPS loudly where they are absent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');

// The compile service's pico-sram.ld, inlined: rp2040js loads the binary
// at 0x20000000 and jumps there — main must be the first function.
const PICO_SRAM_LD = `ENTRY(main)
MEMORY { RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 256K }
SECTIONS {
  .text : { *(.text.startup*) *(.text.main) *(.text*) *(.rodata*) } > RAM
  .data : { *(.data*) } > RAM
  .bss  : { *(.bss*) *(COMMON) } > RAM
}
`;

function gccAvailable() {
  try { execSync('arm-none-eabi-gcc --version', { stdio: 'pipe' }); return true; } catch { return false; }
}
const available = gccAvailable()
  && existsSync(join(CUI, 'src', 'model', 'circuit.js'))
  && existsSync(join(BWB, 'src', 'rp2040js-adapter.js'));

test('70-calculator on the Pico: the OLED turns on and draws through real I2C',
  { skip: available ? false : 'needs arm-none-eabi-gcc + bw-circuit-ui/bw-board checkouts' },
  async () => {
    // 1. blocks → pico C → SRAM image
    const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
    const src = readFileSync(join(SB3, 'examples/70-calculator/program.bw'), 'utf8');
    const r = SB3Creator.retargetPseudocode(src, 'pico');
    assert.equal(r.ok, true, (r.reasons || []).join('; '));
    const creator = new SB3Creator();
    creator.parse(r.pseudocode);
    const scratch = mkdtempSync(join(tmpdir(), 'bw-pico-'));
    writeFileSync(join(scratch, 'main.c'), creator.generateC(undefined, {}));
    writeFileSync(join(scratch, 'pico-sram.ld'), PICO_SRAM_LD);
    execSync(`arm-none-eabi-gcc -mcpu=cortex-m0plus -mthumb -Os -ffreestanding -ffunction-sections -nostdlib -Wno-implicit-fallthrough -T${join(scratch, 'pico-sram.ld')} -o ${join(scratch, 'main.elf')} ${join(scratch, 'main.c')} -lgcc`,
      { stdio: 'pipe' });
    execSync(`arm-none-eabi-objcopy -O binary ${join(scratch, 'main.elf')} ${join(scratch, 'main.bin')}`,
      { stdio: 'pipe' });
    const bin = readFileSync(join(scratch, 'main.bin'));
    const program = new Uint16Array(bin.buffer, bin.byteOffset, Math.floor(bin.length / 2));

    // 2. bench → board (sidecars bulk-loaded)
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
      readFileSync(join(SB3, 'examples/70-calculator/circuit.pico.json'), 'utf8')));
    assert.equal(circ.netlistError, null, 'engine accepts the bench');
    const board = circ.board;

    // 3. rp2040js attached to the board; count what reaches the BOARD
    const { createRp2040jsAdapter } = await import(join(BWB, 'src/rp2040js-adapter.js'));
    const adapter = createRp2040jsAdapter({ program });
    let sdaEdges = 0, sclEdges = 0;
    const origSetPin = board.setPin.bind(board);
    board.setPin = (pin, mode, drive) => {
      const p = String(pin).toLowerCase();
      if (p === 'gp4') sdaEdges++;
      else if (p === 'gp5') sclEdges++;
      return origSetPin(pin, mode, drive);
    };
    adapter.attachBoard(board);
    for (let i = 0; i < 12; i++) adapter.advanceNs(50_000_000);

    // 4. the assertions that catch a publish gap AND a dead bus
    assert.ok(sclEdges > 1000, `SCL toggles at the board (${sclEdges} events)`);
    assert.ok(sdaEdges > 100, `SDA toggles at the board (${sdaEdges} events)`);
    assert.ok(board.readAnalog('GP4') > 3, 'bus idles HIGH through the pull-ups');
    const oled = circ.parts.find((p) => p.kind === 'ssd1306');
    const st = board.getDeviceState(oled.id);
    assert.equal(st.displayOn, true, 'SSD1306 received its bring-up (charge pump + display on)');
    const lit = st.fb.reduce((a, b) => a + (b ? 1 : 0), 0);
    assert.ok(lit >= 20, `framebuffer carries the header text (${lit} non-zero bytes)`);
  });
