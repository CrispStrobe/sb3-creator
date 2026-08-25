// Wall-clock cost of a fixed amount of SIM time, old vs new pico scheduler.
// Usage: node scripts/_tmp-idle-bench.mjs <label>
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const PICO_SRAM_LD = `ENTRY(main)
MEMORY { RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 256K }
SECTIONS {
  .text : { *(.text.startup*) *(.text.main) *(.text*) *(.rodata*) } > RAM
  .data : { *(.data*) } > RAM
  .bss  : { *(.bss*) *(COMMON) } > RAM
}
`;

const SB3Creator = (await import(join(SB3, 'src/utils/sb3Creator.js'))).default;
const src = readFileSync(join(SB3, 'examples/70-calculator/program.bw'), 'utf8');
const creator = new SB3Creator();
creator.parse(src);
const cSrc = creator.generateC(undefined, {});
console.log('generator emits bw_idle:', cSrc.includes('bw_idle'));
const scratch = mkdtempSync(join(tmpdir(), 'bw-idlebench-'));
writeFileSync(join(scratch, 'main.c'), cSrc);
writeFileSync(join(scratch, 'pico-sram.ld'), PICO_SRAM_LD);
execSync(`arm-none-eabi-gcc -mcpu=cortex-m0plus -mthumb -Os -ffreestanding -ffunction-sections -nostdlib -Wno-implicit-fallthrough -T${join(scratch, 'pico-sram.ld')} -o ${join(scratch, 'main.elf')} ${join(scratch, 'main.c')} -lgcc`, { stdio: 'pipe' });
execSync(`arm-none-eabi-objcopy -O binary ${join(scratch, 'main.elf')} ${join(scratch, 'main.bin')}`, { stdio: 'pipe' });
const bin = readFileSync(join(scratch, 'main.bin'));
const program = new Uint16Array(bin.buffer, bin.byteOffset, Math.floor(bin.length / 2));

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
    } catch { /* absent sidecar */ }
}
const { Circuit } = await import(join(CUI, 'src/model/circuit.js'));
const circ = Circuit.fromJSON(JSON.parse(readFileSync(join(SB3, 'examples/70-calculator/circuit.json'), 'utf8')));
const board = circ.board;
const { createRp2040jsAdapter } = await import(join(BWB, 'src/rp2040js-adapter.js'));
const adapter = createRp2040jsAdapter({ program });
adapter.attachBoard(board);

// boot: 600 ms sim (banner draw)
let w0 = performance.now();
for (let i = 0; i < 12; i++) adapter.advanceNs(50_000_000);
console.log(`boot 600 ms sim: ${(performance.now() - w0).toFixed(0)} ms wall`);
// steady idle: 2 s sim in 50 ms slices
w0 = performance.now();
for (let i = 0; i < 40; i++) adapter.advanceNs(50_000_000);
const wall = performance.now() - w0;
console.log(`steady 2000 ms sim: ${wall.toFixed(0)} ms wall  ->  sim/wall = ${(2000 / wall).toFixed(2)}`);
console.log(`exec instr: ${globalThis.__execCount || 0}  wait-jumps: ${globalThis.__waitJumps || 0}  slept-ns: ${globalThis.__waitNs || 0}`);
