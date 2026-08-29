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
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine, registerSidecars } from '../scripts/lib/engine-surface.mjs';
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
// Disposition (a) of test/CROSS-REPO-GATE-AUDIT.md — CI-RUNNABLE.
//
// Unlike the emu8051 chain next door, nothing here is expensive to provide: the
// siblings are public repos CI checks out at pinned revisions, and
// arm-none-eabi-gcc is a stock apt package. Both are installed in
// .github/workflows/ci.yml, so this test runs in CI rather than skipping, and an
// absent sibling is a failure.
const siblingGate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(siblingGate, 'the Pico OLED chain');

const skipReason = siblingGate.skip ||
  (gccAvailable() ? false
    : 'needs arm-none-eabi-gcc (CI installs it; locally: apt install gcc-arm-none-eabi)');
const available = !skipReason;

test('70-calculator on the Pico: the REAL build — keys to +3V3, OLED on GP0/GP1',
  { skip: skipReason },
  async () => {
    // 1. blocks → pico C → SRAM image
    const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
    const src = readFileSync(join(SB3, 'examples/70-calculator/program.bw'), 'utf8');
    // The example is AUTHORED on the Pico now — the pin map is the real
    // hardware's (GP0/GP1 bus, GP2-GP18 keys to +3V3), and retarget is
    // the identity for it, so nothing can move these pins.
    const r = SB3Creator.retargetPseudocode(src, 'pico');
    assert.equal(r.ok, true, (r.reasons || []).join('; '));
    assert.equal(r.pseudocode, src, 'authored device: retarget is the identity');
    const creator = new SB3Creator();
    creator.parse(src);
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
    const { Circuit } = await injectEngine({ board: BWB, cui: CUI });
    await registerSidecars(CUI);
    // The pico bench IS the authored circuit — the app loads it directly.
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

    // 3. rp2040js attached to the board; count what reaches the BOARD
    const { createRp2040jsAdapter } = await import(join(BWB, 'src/rp2040js-adapter.js'));
    const adapter = createRp2040jsAdapter({ program });
    let sdaEdges = 0, sclEdges = 0;
    const origSetPin = board.setPin.bind(board);
    board.setPin = (pin, mode, drive) => {
      const p = String(pin).toLowerCase();
      if (p === 'gp0') sdaEdges++;
      else if (p === 'gp1') sclEdges++;
      return origSetPin(pin, mode, drive);
    };
    adapter.attachBoard(board);
    for (let i = 0; i < 12; i++) adapter.advanceNs(50_000_000);

    // 4. the assertions that catch a publish gap AND a dead bus —
    // on the REAL pins (GP0 sda, GP1 scl)
    assert.ok(sclEdges > 1000, `SCL toggles at the board (${sclEdges} events)`);
    assert.ok(sdaEdges > 100, `SDA toggles at the board (${sdaEdges} events)`);
    assert.ok(board.readAnalog('GP0') > 3, 'bus idles HIGH through the pull-ups');
    const oled = circ.parts.find((p) => p.kind === 'ssd1306');
    const st = board.getDeviceState(oled.id);
    assert.equal(st.displayOn, true, 'SSD1306 received its bring-up (charge pump + display on)');
    const lit0 = st.fb.reduce((a, b) => a + (b ? 1 : 0), 0);
    assert.ok(lit0 >= 20, `framebuffer carries the RECHNER header (${lit0} non-zero bytes)`);
    const before = st.fb.join(',');

    // 5. press '5' (active HIGH: the key connects its GPIO to +3V3 and
    // the internal pull-DOWN gives the idle low) — the entry glyph
    // changes from '0' to '5'. Same COLUMN COUNT, different pixels:
    // content compare, not a byte count.
    board.setControl('k_b5', 1);
    for (let i = 0; i < 4; i++) adapter.advanceNs(50_000_000);
    board.setControl('k_b5', 0);
    for (let i = 0; i < 2; i++) adapter.advanceNs(50_000_000);
    assert.notEqual(st.fb.join(','), before, 'a key press redraws the entry glyph');
  });
