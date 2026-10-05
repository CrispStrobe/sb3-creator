// The REAL chain for any portable program: retarget -> generateC -> the
// device's own compiler with the compile service's flags -> the device's
// emulator in bw-board -> the bench inferred from the program's declarations
// on the board MNA. Every gap a dialect feature claims to close is closed when
// a program using it does what it says HERE, on every core it retargets to --
// not when its C compiles.
//
// Flags and linker scripts are the hosted compile service's
// (CrispStrobe/stc-compiler app.py TARGETS / AVR_TARGETS / ARM_TARGETS,
// pico-sram.ld, stm32f030-flash.ld), copied rather than invented: a chain that
// builds differently from the service measures a different binary.
//
// Needs the toolchain for the family (sdcc / avr-gcc / arm-none-eabi-gcc), the
// bw-board and bw-circuit-ui siblings, and for the 8051 the emscripten build of
// emu8051-stc. `chainSkip(device)` names whatever is missing so a test can skip
// LOUDLY instead of passing over nothing.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SB3Creator from '../../src/utils/sb3Creator.js';
import { injectEngine, registerSidecars, locateSibling } from '../../scripts/lib/engine-surface.mjs';
import { DEVPART } from '../../scripts/lib/devpart.mjs';

const SB3 = join(import.meta.dirname, '..', '..');

export const FAMILY = {
    stc12c5a60s2: '8051', stc15f2k60s2: '8051', stc89c52rc: '8051',
    'arduino-uno': 'avr', 'arduino-nano': 'avr', atmega168p: 'avr', 'arduino-mega': 'avr',
    attiny88: 'avr', attiny85: 'avr',
    pico: 'rp2040', stm32f030: 'stm32',
};

const SDCC_FLAGS = {
    stc12c5a60s2: ['--iram-size', '256', '--xram-size', '1024', '--code-size', '61440'],
    stc15f2k60s2: ['--iram-size', '256', '--xram-size', '1792', '--code-size', '61440'],
    stc89c52rc: ['--iram-size', '256', '--xram-size', '256', '--code-size', '8192'],
};
// The emulator models: the 168P has the 328P's peripherals at half the flash,
// which is the property every generated program relies on.
const AVR_MCU = {
    'arduino-uno': ['atmega328p', 'atmega328p', 16_000_000],
    'arduino-nano': ['atmega328p', 'atmega328p', 16_000_000],
    atmega168p: ['atmega168p', 'atmega328p', 16_000_000],
    'arduino-mega': ['atmega2560', 'atmega2560', 16_000_000],
    attiny88: ['attiny88', 'attiny88', 8_000_000],
    attiny85: ['attiny85', 'attiny85', 8_000_000],
};

const PICO_SRAM_LD = `ENTRY(main)
MEMORY { RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 256K }
SECTIONS {
  .text : { *(.text.startup*) *(.text.main) *(.text*) *(.rodata*) } > RAM
  .data : { *(.data*) } > RAM
  .bss  : { *(.bss*) *(COMMON) } > RAM
}
`;
const STM32_FLASH_LD = `ENTRY(main)
MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 16K
    RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 4K
}
SECTIONS
{
    .text : { KEEP(*(.vectors)) *(.text.startup*) *(.text*) *(.rodata*) } > FLASH
    .bss  : { *(.bss*) *(COMMON) } > RAM
}
`;

const has = (bin) => { try { execFileSync(bin, ['--version'], { stdio: 'pipe' }); return true; } catch { return false; } };
const EMU_JS = process.env.EMU8051_JS || join(SB3, '..', 'emu8051-stc', 'build', 'emu8051.js');

/** Why this device's chain cannot run here, or null. */
export function chainSkip(device) {
    const fam = FAMILY[device];
    if (!fam) return `no chain for ${device}`;
    if (!locateSibling('bw-board') || !locateSibling('bw-circuit-ui')) return 'needs the bw-board and bw-circuit-ui siblings';
    if (fam === '8051' && !has('sdcc')) return 'needs sdcc';
    if (fam === '8051' && !existsSync(EMU_JS)) return `needs the emu8051-stc build at ${EMU_JS} (or EMU8051_JS)`;
    if (fam === 'avr' && !has('avr-gcc')) return 'needs avr-gcc';
    if ((fam === 'rp2040' || fam === 'stm32') && !has('arm-none-eabi-gcc')) return 'needs arm-none-eabi-gcc';
    return null;
}

/** Retarget `src` to `device`, parse it clean, and return the creator. */
export function buildFor(src, device) {
    const authored = ((src.match(/^DEVICE\s+([\w-]+)/im) || [])[1] || '').toLowerCase();
    const text = authored === device ? src : (() => {
        const r = SB3Creator.retargetPseudocode(src, device);
        if (!r.ok) throw new Error(`retarget to ${device} refused: ${(r.reasons || []).join('; ')}`);
        return r.pseudocode;
    })();
    const c = new SB3Creator();
    c.parse(text);
    if (c.warnings.length) throw new Error(`${device}: parse warnings: ${c.warnings.join(' | ')}`);
    return c;
}

/** Compile the creator's C for `device`; returns {kind, image}. */
export function compileFor(creator, device) {
    const fam = FAMILY[device];
    const dir = mkdtempSync(join(tmpdir(), `bw-chain-${device}-`));
    try {
        const code = creator.generateC();
        if (/no C equivalent/.test(code)) {
            throw new Error(`${device}: the emitter dropped a statement:\n`
                + code.split('\n').filter((l) => /no C equivalent/.test(l)).join('\n'));
        }
        writeFileSync(join(dir, 'main.c'), code);
        const run = (bin, args) => execFileSync(bin, args, { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
        if (fam === '8051') {
            run('sdcc', ['-mmcs51', ...SDCC_FLAGS[device], '-o', 'main.ihx', 'main.c']);
            return { kind: 'ihx', image: readFileSync(join(dir, 'main.ihx'), 'utf8'), code };
        }
        if (fam === 'avr') {
            const [mcu, , clock] = AVR_MCU[device];
            const args = [`-mmcu=${mcu}`, '-Os', '-std=c99', '-Wno-implicit-fallthrough',
                '-ffunction-sections', '-fdata-sections', '-Wl,--gc-sections', '-o', 'main.elf', 'main.c'];
            if (!/^\s*#\s*define\s+F_CPU\b/m.test(code)) args.unshift(`-DF_CPU=${clock}UL`);
            run('avr-gcc', args);
            run('avr-objcopy', ['-O', 'binary', '-R', '.eeprom', 'main.elf', 'main.bin']);
            const bin = readFileSync(join(dir, 'main.bin'));
            const padded = Buffer.alloc(bin.length + (bin.length & 1)); bin.copy(padded);
            return { kind: 'avr', image: new Uint16Array(padded.buffer, padded.byteOffset, padded.length / 2), code };
        }
        const ld = fam === 'rp2040' ? PICO_SRAM_LD : STM32_FLASH_LD;
        writeFileSync(join(dir, 'link.ld'), ld);
        run('arm-none-eabi-gcc', [`-mcpu=${fam === 'rp2040' ? 'cortex-m0plus' : 'cortex-m0'}`, '-mthumb', '-Os',
            '-ffreestanding', '-ffunction-sections', '-nostdlib', '-Wno-implicit-fallthrough',
            '-Tlink.ld', '-o', 'main.elf', 'main.c', '-lgcc']);
        run('arm-none-eabi-objcopy', ['-O', 'binary', 'main.elf', 'main.bin']);
        const bin = readFileSync(join(dir, 'main.bin'));
        if (fam === 'stm32') return { kind: 'stm32', image: new Uint8Array(bin), code };
        const padded = Buffer.alloc(bin.length + (bin.length & 1)); bin.copy(padded);
        return { kind: 'rp2040', image: new Uint16Array(padded.buffer, padded.byteOffset, padded.length / 2), code };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

let engine = null;
async function theEngine() {
    if (!engine) {
        const cui = locateSibling('bw-circuit-ui');
        engine = await injectEngine({ board: locateSibling('bw-board'), cui });
        await registerSidecars(cui);
    }
    return engine;
}

/** The bench the gallery generator would build for this program on this device. */
export async function benchFor(creator, device, { display } = {}) {
    const { surface, Circuit } = await theEngine();
    const nl = surface.inferNetlist(creator.project.stc, display ? { display } : undefined);
    const kind = DEVPART[device];
    const ids = new Set();
    for (const p of nl.parts) if (p.kind === 'mcu') {
        p.kind = kind; ids.add(p.id);
        if (kind !== 'mcu') p.terminals = p.terminals.map((t) => String(t).toLowerCase());
    }
    if (kind !== 'mcu') for (const n of nl.nets) for (const t of n.terminals) {
        if (ids.has(t.part)) t.terminal = String(t.terminal).toLowerCase();
    }
    const circ = Circuit.fromJSON({ vcc: FAMILY[device] === 'rp2040' || FAMILY[device] === 'stm32' ? 3.3 : 5,
        parts: nl.parts, wires: [], holeWires: [] });
    circ.syncWithExternalNets(nl.nets);
    if (!circ.board || !circ.board.parts.length) throw new Error(`${device}: the engine rejected the bench`);
    return circ;
}

/**
 * Run `src` on `device`. Returns { circuit, board, adapter, events, serial, run(ms),
 * pinOf(name) }. `events` records every pin write the firmware makes as
 * { tNs, pin, high }, `serial` accumulates UART text where the adapter exposes it.
 */
export async function runOn(src, device, { bench } = {}) {
    const creator = buildFor(src, device);
    const fw = compileFor(creator, device);
    const circuit = bench ? await bench(creator) : await benchFor(creator, device);
    const board = circuit.board;
    const events = [];
    const origSetPin = board.setPin.bind(board);
    board.setPin = (pin, mode, drive) => {
        events.push({ tNs: Number(board.timeNs ?? 0n), pin: String(pin).toLowerCase(), mode, high: !!drive });
        return origSetPin(pin, mode, drive);
    };
    const out = { creator, code: fw.code, circuit, board, events, serial: '' };
    const fam = FAMILY[device];
    const BWB = locateSibling('bw-board');
    let adapter;
    if (fam === '8051') {
        const Module = await (await import(EMU_JS)).default();
        const { createEmu8051Adapter } = await import(join(BWB, 'src/emu8051-adapter.js'));
        adapter = createEmu8051Adapter(Module, { part: device, fosc: creator.project.stc.clock || 11059200,
            vcc: 5.0, ports: [0, 1, 2, 3] });
        adapter.loadHex(fw.image);
        adapter.attachBoard(board);
        out.run = (ms) => adapter.runNs(ms * 1_000_000);
        // The adapter has no serial surface; the emulator calls back on every
        // byte written to SBUF (its own visual ring is 18 bytes).
        Module._emu_set_serial_callback(Module.addFunction((byte) => {
            out.serial += String.fromCharCode(byte & 0xFF);
        }, 'vii'));
        out.send = (text) => { for (const ch of String(text)) Module._emu_serial_write(ch.charCodeAt(0) & 0xFF); };
    } else {
        if (fam === 'avr') {
            const { createAvr8jsAdapter } = await import(join(BWB, 'src/avr8js-adapter.js'));
            adapter = createAvr8jsAdapter({ chip: AVR_MCU[device][1], program: fw.image });
        } else if (fam === 'rp2040') {
            const { createRp2040jsAdapter } = await import(join(BWB, 'src/rp2040js-adapter.js'));
            adapter = createRp2040jsAdapter({ program: fw.image });
        } else {
            const { createStm32F0Adapter } = await import(join(BWB, 'src/stm32-adapter.js'));
            adapter = createStm32F0Adapter({ program: fw.image });
        }
        if (typeof adapter.onSerial === 'function') adapter.onSerial((s) => { out.serial += typeof s === 'number' ? String.fromCharCode(s) : String(s); });
        /** Type `text` into the chip's serial RX (a serial monitor's "send"). */
        out.send = (text) => adapter.sendSerial([...String(text)].map((ch) => ch.charCodeAt(0) & 0xFF));
        adapter.attachBoard(board);
        out.run = (ms) => { for (let i = 0; i < ms; i += 10) adapter.advanceNs(Math.min(10, ms - i) * 1_000_000); };
    }
    out.adapter = adapter;
    /** Toggles of a pin's written level inside [fromMs, toMs). */
    out.edges = (pin, fromMs = 0, toMs = Infinity) => {
        const p = String(pin).toLowerCase();
        const w = events.filter((e) => e.pin === p && e.tNs >= fromMs * 1e6 && e.tNs < toMs * 1e6);
        let n = 0; for (let i = 1; i < w.length; i++) if (w[i].high !== w[i - 1].high) n++;
        return n;
    };
    /** The MCU pin a declared name was retargeted to. */
    out.pinOf = (name) => {
        const pin = creator.project.stc.pins.find((p) => p.name.toLowerCase() === String(name).toLowerCase());
        if (!pin) throw new Error(`no pin ${name}`);
        return String(pin.where || `P${pin.port}.${pin.bit}`).toLowerCase();
    };
    return out;
}
