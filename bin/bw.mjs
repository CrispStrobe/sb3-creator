#!/usr/bin/env node
// bw — the BrickWright workshop on the command line.
//
// One binary for the whole loop the app performs, so a terminal (or a CI
// job, or an agent) can do it too:
//
//   bw check <file.bw>                       parse + warnings
//   bw devices [file.bw]                     retargetable devices (with a file:
//                                            which ones THIS program fits)
//   bw retarget <file.bw> <device> [-o out]  same program, the target's pins
//   bw transpile <file.bw> --to c|cowgol|micropython|python|sb3 [--device D] [-o out]
//                --to cowgol [--target native-profile]
//   bw read <file.c|file.cow|file.py> [-o out.bw]     the reverse direction
//   bw compile <file.bw> [--device D] [-o out]
//                                            C + local toolchain where present
//                                            (sdcc for the 8051s, arm-none-eabi
//                                            for the Pico SRAM image)
//   bw export-game <file> --to web|pygame [-o dir|out.zip]
//                                            playable game project (bwgame-v1)
//   bw flash <file.bw|.hex|.bin|.rom> [--port /dev/cu.X] [--engine js|rust]
//                                            Pico over USB: MicroPython main.py
//                                            via mpremote, then reset
//
// Transfer today means MicroPython on the Pico — the exact flow that put
// the owner's calculator on real silicon (2026-08-17): BOOTSEL → UF2 →
// mpremote cp main.py → reset.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, execSync } from 'child_process';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';
import {isCrispBasicPseudocode, crispBasicModeError} from '../src/utils/crispBasicMode.js';

const args = process.argv.slice(2);
const cmd = args[0];
const positional = [];
const opts = {};
for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--target=')) {
        opts.target = args[i].slice('--target='.length);
        if (!opts.target) { console.error('bw: --target needs a native Cowgol profile'); process.exit(2); }
    } else if (args[i] === '--to' || args[i] === '--device' || args[i] === '--port' || args[i] === '--firmware' || args[i] === '--engine' || args[i] === '--rust-bin' || args[i] === '--wait' || args[i] === '--title' || args[i] === '--target' || args[i] === '-o') {
        if (args[i] === '--target' && (!args[i + 1] || args[i + 1].startsWith('-'))) {
            console.error('bw: --target needs a native Cowgol profile'); process.exit(2);
        }
        opts[args[i].replace(/^-+/, '')] = args[++i];
    } else if (args[i].startsWith('--')) opts[args[i].slice(2)] = true;
    else positional.push(args[i]);
}

const die = (msg, code = 2) => { console.error(`bw: ${msg}`); process.exit(code); };
const readInput = (p) => {
    try { return fs.readFileSync(p, 'utf8'); } catch { die(`cannot read ${p}`); }
};
const writeOut = (text, out) => {
    if (out) { fs.writeFileSync(out, text); console.log(`wrote ${out} (${text.length} bytes)`); }
    else process.stdout.write(text);
};
const parseBw = (code, strict = false) => {
    const c = new SB3Creator();
    try { c.parse(code); } catch (e) { die(`parse error: ${e.message}`, 1); }
    if (strict && c.warnings?.length) die(`native Cowgol source has parser warnings: ${c.warnings.join('; ')}`, 1);
    for (const w of c.warnings || []) console.error(`warning: ${w}`);
    return c;
};
const maybeRetarget = (code, device, strict = false) => {
    if (!device) return code;
    if (isCrispBasicPseudocode(code)) die(crispBasicModeError('retargeting').message, 1);
    // `spikeprime` is the extension/device name users see; the dialect header
    // predates it and is spelled `DEVICE SPIKE`. This target has domain verbs,
    // not a pin-retarget pool, so selecting it either confirms that header or
    // supplies it to an otherwise device-free SPIKE program.
    if (/^spike(?:prime)?$/i.test(device)) {
        const declared = code.match(/^DEVICE\s+(\S+)/im);
        if (!declared) return `DEVICE SPIKE\n\n${code}`;
        if (/^spike$/i.test(declared[1])) return code;
    }
    const r = SB3Creator.retargetPseudocode(code, device);
    if (!r.ok) die(`retarget to ${device} refused: ${r.reasons.join('; ')}`, 1);
    if (strict && r.warnings?.length) die(`native Cowgol retarget has parser warnings: ${r.warnings.join('; ')}`, 1);
    for (const w of r.warnings || []) console.error(`warning: ${w}`);
    return r.pseudocode;
};

if (Object.hasOwn(opts, 'target') && (cmd !== 'transpile' || !['cowgol', 'cow'].includes(opts.to))) {
    die('--target is only supported by transpile --to cowgol');
}

switch (cmd) {
    case 'check': {
        const c = parseBw(readInput(positional[0] ?? die('check needs a file')));
        const v = c.validate();
        for (const e of v.errors || []) console.error(`error: ${e}`);
        console.log(v.isValid ? 'ok' : 'INVALID');
        process.exit(v.isValid ? 0 : 1);
        break;
    }

    case 'devices': {
        const all = Object.keys(SB3Creator.RETARGET_POOLS);
        if (!positional[0]) { console.log(all.join('\n')); break; }
        const code = readInput(positional[0]);
        const authored = ((code.match(/^DEVICE\s+([\w-]+)/im) || [])[1] || '')
            .toLowerCase().replace(/_/g, '-');
        for (const d of all) {
            const r = SB3Creator.retargetPseudocode(code, d);
            const tag = d === authored ? 'authored' : r.ok ? 'ok' : `refused: ${r.reasons[0]}`;
            console.log(`${d.padEnd(14)} ${tag}`);
        }
        break;
    }

    case 'retarget': {
        const [file, device] = positional;
        if (!file || !device) die('retarget needs <file.bw> <device>');
        writeOut(maybeRetarget(readInput(file), device), opts.o);
        break;
    }

    case 'transpile': {
        const file = positional[0] ?? die('transpile needs a file');
        const to = opts.to ?? die('transpile needs --to c|cowgol|micropython|python|javascript|sb3|crispbasic');
        let c;
        if (['cowgol', 'cow'].includes(to) && /\.sb3$/i.test(file)) {
            // Export the authored graph. Decompiling to text and reparsing can
            // discard unsupported extension blocks before Cowgol sees them.
            if (opts.device) die('Cowgol .sb3 export does not accept --device; retarget authored source explicitly first', 1);
            try {
                const JSZip = (await import('jszip')).default;
                const archive = await JSZip.loadAsync(fs.readFileSync(file));
                const entry = archive.file('project.json');
                if (!entry) throw new Error('archive has no project.json');
                const project = JSON.parse(await entry.async('string'));
                if (!Array.isArray(project?.targets)) throw new Error('project.json has no targets');
                c = new SB3Creator(); c.project = project;
            } catch (error) { die(`cannot read .sb3: ${error.message}`, 1); }
        } else {
            const text = readInput(file);
            if (isCrispBasicPseudocode(text) && to !== 'crispbasic') die(crispBasicModeError(to).message, 1);
            const native = ['cowgol', 'cow'].includes(to) && Object.hasOwn(opts, 'target');
            // Retargeting reparses/decompiles the source. Refuse any lossy
            // parse before that step, as well as after the explicit retarget.
            if (native && opts.device) parseBw(text, true);
            c = parseBw(maybeRetarget(text, opts.device, native), native);
        }
        if (to === 'crispbasic') {
            const result = c.generateBASIC(undefined, {profile: 'bbc', mode: 'crispbasic', lineNumbers: Boolean(opts.numbered)});
            if (!result.ok) die(`CrispBASIC generation refused: ${result.reasons.join('; ')}`, 1);
            for (const warning of result.warnings || []) console.error(`warning: ${warning}`);
            writeOut(result.basic, opts.o);
        } else if (to === 'c') {
            // debug:true = the proven form `bw compile` and the browser use;
            // it forces the cooperative scheduler so `@bw` round-trip markers
            // are present and the STM32 path takes its TIM3 timebase. Without
            // it the two commands disagreed on the same input.
            writeOut(c.generateC(undefined, { debug: true }), opts.o);
            for (const w of c._cWarnings || []) console.error(`warning: ${w}`);
        } else if (to === 'cowgol' || to === 'cow') {
            const r = c.generateCowgol(undefined, Object.hasOwn(opts, 'target') ? {target: opts.target} : {});
            if (!r.ok) die(`cowgol refused: ${r.reasons.join('; ')}`, 1);
            for (const w of r.warnings || []) console.error(`warning: ${w}`);
            writeOut(r.cowgol, opts.o);
        } else if (to === 'micropython') {
            const r = c.generateMicroPython();
            if (!r.ok) die(`micropython refused: ${r.reasons.join('; ')}`, 1);
            for (const w of r.warnings || []) console.error(`warning: ${w}`);
            writeOut(r.py, opts.o);
        } else if (to === 'python') {
            const r = c.generatePython(undefined, {});
            writeOut(typeof r === 'string' ? r : r.py ?? r.code ?? '', opts.o);
        } else if (to === 'javascript' || to === 'js') {
            writeOut(c.generateJavaScript(undefined, {}), opts.o);
        } else if (to === 'sb3') {
            const out = opts.o || file.replace(/\.[^.]+$/, '') + '.sb3';
            const blob = await c.generateSB3();
            fs.writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
            console.log(`wrote ${out}`);
        } else die(`unknown target ${to}`);
        break;
    }

    case 'read': {
        const file = positional[0] ?? die('read needs a file');
        const src = readInput(file);
        let result;
        if (/\.c$/i.test(file)) {
            const { default: c2bw } = await import('../src/utils/cToPseudocode.js');
            result = c2bw(src);
        } else if (/\.(cow|cowgol)$/i.test(file)) {
            const { default: cow2bw } = await import('../src/utils/cowgolToPseudocode.js');
            result = cow2bw(src);
        } else if (/\.py$/i.test(file)) {
            if (/^\s*from\s+(machine|microbit)\s+import/m.test(src)) {
                const { default: mp2bw } = await import('../src/utils/micropythonToPseudocode.js');
                result = mp2bw(src);
            } else {
                const { default: py2bw } = await import('../src/utils/pythonToPseudocode.js');
                result = py2bw(src);
            }
        } else if (/\.js$/i.test(file)) {
            const { default: js2bw } = await import('../src/utils/javascriptToPseudocode.js');
            result = js2bw(src);
        } else if (/\.(bas|basic)$/i.test(file)) {
            const { default: bas2bw } = await import('../src/utils/basicToPseudocode.js');
            result = bas2bw(src, opts.crispbasic ? {mode: 'crispbasic'} : {});
        } else if (/\.sb3$/i.test(file)) {
            const { readFileSync } = await import('fs');
            const JSZip = (await import('jszip')).default;
            const buf = readFileSync(file);
            const zip = await JSZip.loadAsync(buf);
            const projJson = await zip.file('project.json').async('string');
            const project = JSON.parse(projJson);
            const c = new SB3Creator();
            result = { pseudocode: c.decompile(project), warnings: [] };
        } else die('read understands .c, .cow, .cowgol, .py, .js, .bas and .sb3');
        if (result.ok === false) die(`read refused: ${(result.reasons || result.errors || ['conversion is unsupported']).join('; ')}`, 1);
        for (const w of result.warnings || []) console.error(`warning: ${w}`);
        writeOut(result.pseudocode ?? '', opts.o);
        break;
    }

    case 'compile': {
        const file = positional[0] ?? die('compile needs a file');
        const code = maybeRetarget(readInput(file), opts.device);
        if (isCrispBasicPseudocode(code)) die(crispBasicModeError('native compilation').message, 1);
        const c = parseBw(code);
        // debug:true is the proven-correct emission (every chain test and the
        // lite app use it): WITHOUT it an STM32 build leaks pico's BW_TIMER
        // registers into the arm-but-not-stm32 scheduler path — a wrong image
        // that only surfaced when `bw compile` grew a real STM32 gcc branch.
        const cSrc = c.generateC(undefined, { debug: true });
        const dev = (opts.device || ((code.match(/^DEVICE\s+([\w-]+)/im) || [])[1] || ''))
            .toLowerCase().replace(/_/g, '-');
        const work = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-compile-'));
        fs.writeFileSync(path.join(work, 'main.c'), cSrc);
        const have = (tool) => { try { execSync(`${tool} --version`, { stdio: 'pipe' }); return true; } catch { return false; } };
        if (/^stc|^at89/.test(dev) && have('sdcc')) {
            const xram = dev.startsWith('stc15') ? '1792' : dev.startsWith('stc89') ? '256' : '1024';
            const codeSize = dev.startsWith('stc89') ? '8192' : '61440';
            execFileSync('sdcc', ['-mmcs51', '--iram-size', '256', '--xram-size', xram,
                '--code-size', codeSize,
                '-o', path.join(work, 'main.ihx'), path.join(work, 'main.c')], { stdio: 'inherit' });
            const out = opts.o || file.replace(/\.[^.]+$/, '') + '.ihx';
            fs.mkdirSync(path.dirname(out), { recursive: true });
            fs.copyFileSync(path.join(work, 'main.ihx'), out);
            console.log(`wrote ${out} (Intel HEX)`);
            console.log('  flash it with the fleet\'s own stcbsl (stc repo, MIT, silicon-proven):');
            console.log(`    stcbsl --port /dev/cu.usbserial-X flash ${out}`);
            console.log('  then PULL THE POWER and reapply it — the STC ISP bootloader only answers after a cold power-on.');
        } else if (dev === 'pico' && have('arm-none-eabi-gcc')) {
            if (opts.uf2) {
                // RAM-boot UF2, the MakeCode lesson made concrete: the
                // RP2040 bootrom accepts SRAM-targeted UF2 blocks and
                // vectors into the image after the copy — drag the file
                // onto RPI-RP2 and the program runs, no boot2, no flash
                // linkage, no cable protocol, works from Safari. The image
                // leads with a real vector table (SP top of SRAM, reset →
                // main) instead of the emulator layout's main-first.
                fs.writeFileSync(path.join(work, 'vectors.c'),
                    'extern int main(void);\n'
                    + 'void _reset(void) { main(); for (;;) {} }\n'
                    + '__attribute__((section(".vectors"), used))\n'
                    + 'const unsigned int __vectors[] = { 0x20042000u, (unsigned int)&_reset };\n');
                fs.writeFileSync(path.join(work, 'pico-uf2.ld'),
                    'ENTRY(_reset)\nMEMORY { RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 256K }\n'
                    + 'SECTIONS {\n  .vectors : { KEEP(*(.vectors)) } > RAM\n'
                    + '  .text : { *(.text.startup*) *(.text.main) *(.text*) *(.rodata*) } > RAM\n'
                    + '  .data : { *(.data*) } > RAM\n  .bss  : { *(.bss*) *(COMMON) } > RAM\n}\n');
                execFileSync('arm-none-eabi-gcc', ['-mcpu=cortex-m0plus', '-mthumb', '-Os',
                    '-ffreestanding', '-ffunction-sections', '-nostdlib', '-Wno-implicit-fallthrough',
                    `-T${path.join(work, 'pico-uf2.ld')}`, '-o', path.join(work, 'main.elf'),
                    path.join(work, 'vectors.c'), path.join(work, 'main.c'), '-lgcc'], { stdio: 'inherit' });
                execFileSync('arm-none-eabi-objcopy', ['-O', 'binary',
                    path.join(work, 'main.elf'), path.join(work, 'main.bin')], { stdio: 'inherit' });
                const { uf2FromBinary } = await import('../src/utils/uf2.js');
                const bin = fs.readFileSync(path.join(work, 'main.bin'));
                const uf2 = uf2FromBinary(new Uint8Array(bin), 0x20000000);
                const out = opts.o || file.replace(/\.[^.]+$/, '') + '.uf2';
                fs.writeFileSync(out, uf2);
                console.log(`wrote ${out} (${uf2.length} bytes) — drag onto the RPI-RP2 drive to run`);
                break;
            }
            // SRAM image for the rp2040js emulator chain (--uf2 makes the
            // drag-drop artifact; `bw flash` speaks MicroPython instead).
            fs.writeFileSync(path.join(work, 'pico-sram.ld'),
                'ENTRY(main)\nMEMORY { RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 256K }\n'
                + 'SECTIONS {\n  .text : { *(.text.startup*) *(.text.main) *(.text*) *(.rodata*) } > RAM\n'
                + '  .data : { *(.data*) } > RAM\n  .bss  : { *(.bss*) *(COMMON) } > RAM\n}\n');
            execFileSync('arm-none-eabi-gcc', ['-mcpu=cortex-m0plus', '-mthumb', '-Os',
                '-ffreestanding', '-ffunction-sections', '-nostdlib', '-Wno-implicit-fallthrough',
                `-T${path.join(work, 'pico-sram.ld')}`, '-o', path.join(work, 'main.elf'),
                path.join(work, 'main.c'), '-lgcc'], { stdio: 'inherit' });
            execFileSync('arm-none-eabi-objcopy', ['-O', 'binary',
                path.join(work, 'main.elf'), path.join(work, 'main.bin')], { stdio: 'inherit' });
            const out = opts.o || file.replace(/\.[^.]+$/, '') + '.bin';
            fs.copyFileSync(path.join(work, 'main.bin'), out);
            console.log(`wrote ${out} (SRAM image for the emulator chain)`);
        } else if (dev === 'stm32f030' && have('arm-none-eabi-gcc')) {
            // A real flash image (vectors first): the same shape the hosted
            // service emits and stm32bsl / the browser flasher write.
            fs.writeFileSync(path.join(work, 'stm32f030-flash.ld'),
                'ENTRY(main)\nMEMORY { FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 16K\n'
                + '  RAM (rwx) : ORIGIN = 0x20000000, LENGTH = 4K }\n'
                + 'SECTIONS { .text : { KEEP(*(.vectors)) *(.text*) *(.rodata*) } > FLASH\n'
                + '  .bss : { *(.bss*) *(COMMON) } > RAM }\n');
            execFileSync('arm-none-eabi-gcc', ['-mcpu=cortex-m0', '-mthumb', '-Os', '-ffreestanding',
                '-nostdlib', `-T${path.join(work, 'stm32f030-flash.ld')}`,
                '-o', path.join(work, 'main.elf'), path.join(work, 'main.c'), '-lgcc'], { stdio: 'inherit' });
            execFileSync('arm-none-eabi-objcopy', ['-O', 'binary',
                path.join(work, 'main.elf'), path.join(work, 'main.bin')], { stdio: 'inherit' });
            const out = opts.o || file.replace(/\.[^.]+$/, '') + '.bin';
            fs.copyFileSync(path.join(work, 'main.bin'), out);
            console.log(`wrote ${out} (STM32 flash image, vectors first)`);
            console.log('  flash it with stm32bsl (stc repo, MIT — the same AN3155 protocol as the browser):');
            console.log(`    stm32bsl --port /dev/cu.usbserial-X ${out}`);
            console.log('  set BOOT0 HIGH and reset first — the ROM bootloader only listens then.');
        } else if (/^arduino|^atmega|^attiny/.test(dev) && have('avr-gcc')) {
            const mcu = dev.includes('2560') ? 'atmega2560'
                : dev.includes('168') ? 'atmega168p'
                    : dev.includes('tiny88') ? 'attiny88' : dev.includes('tiny85') ? 'attiny85'
                        : 'atmega328p';
            execFileSync('avr-gcc', [`-mmcu=${mcu}`, '-Os', '-o', path.join(work, 'main.elf'),
                path.join(work, 'main.c')], { stdio: 'inherit' });
            execFileSync('avr-objcopy', ['-O', 'ihex', '-R', '.eeprom',
                path.join(work, 'main.elf'), path.join(work, 'main.hex')], { stdio: 'inherit' });
            const out = opts.o || file.replace(/\.[^.]+$/, '') + '.hex';
            fs.copyFileSync(path.join(work, 'main.hex'), out);
            console.log(`wrote ${out} (Intel HEX)`);
            if (/^attiny/.test(dev)) {
                console.log(`  ${mcu} has no serial bootloader — it needs a USBasp/USBISP on the ICSP header.`);
                console.log('  The browser IDE flashes a USBasp directly over WebUSB (no extra software).');
                console.log(`  Or, with a programmer tool you already have: e.g. avrdude -c usbasp -p ${mcu} -U flash:w:${out}`);
            } else {
                console.log('  Flash it with the browser IDE\'s Flash button (STK500 over Web Serial, no extra software),');
                console.log(`  or a tool you already have: e.g. avrdude -c arduino -p ${mcu} -P <port> -U flash:w:${out}`);
            }
        } else {
            const out = opts.o || file.replace(/\.[^.]+$/, '') + '.c';
            fs.writeFileSync(out, cSrc);
            console.log(`wrote ${out} — no local toolchain for ${dev || 'this device'}; `
                + 'the hosted service at stc-compiler.vercel.app builds it, and the browser IDE can flash it');
        }
        break;
    }

    case 'bake-uf2': {
        // The Safari-proof deploy, the MakeCode lesson complete: ONE file
        // carrying MicroPython firmware AND the program, already in the
        // filesystem. Drag onto RPI-RP2 (hold BOOTSEL while plugging in)
        // and the program boots — no serial, no mpremote, no Chromium.
        const file = positional[0] ?? die('bake-uf2 needs a file (.bw or .py)');
        const fw = opts.firmware ?? die('bake-uf2 needs --firmware <MicroPython .uf2> '
            + '(micropython.org/download/RPI_PICO/)');
        let py;
        if (/\.py$/i.test(file)) py = readInput(file);
        else {
            const c = parseBw(maybeRetarget(readInput(file), opts.device || 'pico'));
            const r = c.generateMicroPython();
            if (!r.ok) die(`micropython refused: ${r.reasons.join('; ')}`, 1);
            for (const w of r.warnings || []) console.error(`warning: ${w}`);
            py = r.py;
        }
        const { buildLittlefsImage, RPI_PICO_FS } = await import('../src/utils/lfsImage.js');
        const { uf2FromBinary, uf2Concat } = await import('../src/utils/uf2.js');
        const fsImage = await buildLittlefsImage({ 'main.py': new TextEncoder().encode(py) });
        const fwBytes = new Uint8Array(fs.readFileSync(fw));
        const combined = uf2Concat(fwBytes, uf2FromBinary(fsImage, RPI_PICO_FS.flashBase));
        const out = opts.o || file.replace(/\.[^.]+$/, '') + '.uf2';
        fs.writeFileSync(out, combined);
        console.log(`wrote ${out} (${(combined.length / 1024 / 1024).toFixed(1)} MB) — `
            + 'hold BOOTSEL, plug in, drag onto RPI-RP2, done');
        break;
    }

    case 'flash': {
        const file = positional[0] ?? die('flash needs a file (.bw, .py, .hex/.ihx or .bin)');
        if (!/\.(?:hex|ihx|bin|rom)$/i.test(file) && isCrispBasicPseudocode(readInput(file))) die(crispBasicModeError('physical flashing').message, 1);
        // Which family are we flashing? A pre-built artifact carries its
        // own format; a .bw/.py carries a DEVICE (or --device).
        const artifactExt = (file.match(/\.(hex|ihx|bin)$/i) || [,''])[1].toLowerCase();
        let flashDevice = (opts.device || '').toLowerCase().replace(/_/g, '-');
        if (!flashDevice && !artifactExt) {
            flashDevice = ((readInput(file).match(/^DEVICE\s+([\w-]+)/im) || [])[1] || 'pico')
                .toLowerCase().replace(/_/g, '-');
        }
        const serialFamily = (d) =>
            /^stc|^at89/.test(d) ? 'stc'
                : d === 'stm32f030' ? 'stm32'
                    : ['arduino-uno', 'arduino-nano', 'atmega328p', 'atmega168p'].includes(d) ? 'avr'
                        : ['arduino-mega', 'atmega2560'].includes(d) ? 'avr-mega'
                        // A 6502/Z80 breadboard has no bootloader; its ROM is
                        // burned on a Ben Eater EEPROM programmer over serial.
                        : ['eater6502', '6502', 'w65c02', 'z80'].includes(d) ? 'eeprom'
                            : null;
        // A .hex/.ihx is STC or AVR; a .bin is STM32. When flashing an
        // artifact, --device disambiguates hex (defaults to STC).
        const romExt = (file.match(/\.(rom)$/i) || [,''])[1].toLowerCase();
        const family = romExt ? 'eeprom'
            : artifactExt
                ? (artifactExt === 'bin' ? 'stm32' : (serialFamily(flashDevice) || 'stc'))
                : serialFamily(flashDevice);

        if (family) {
            // ---- DIRECT serial flash, reusing the tested flasher --------
            const { nodeSerialPort } = await import('../src/utils/nodeSerialPort.js');
            const flasher = await import('../src/utils/flasher.js');
            // Get the image: a given artifact, or compile the .bw by
            // self-invoking `bw compile` (one command, end to end).
            let imagePath = file;
            if (!artifactExt && !romExt) {
                const outExt = family === 'stm32' ? 'bin' : family === 'eeprom' ? 'rom'
                    : (family === 'avr' || family === 'avr-mega' ? 'hex' : 'ihx');
                imagePath = file.replace(/\.[^.]+$/, '') + '.' + outExt;
                execFileSync(process.execPath, [fileURLToPath(import.meta.url), 'compile', file,
                    '--device', flashDevice, '-o', imagePath], { stdio: 'inherit' });
            }
            const portPath = opts.port
                || fs.readdirSync('/dev').filter((d) => /^cu\.(usbserial|usbmodem|SLAB|wchusbserial)/.test(d))
                    .map((d) => `/dev/${d}`)[0];
            if (!portPath) die('no serial device found — plug the board in and/or pass --port /dev/cu.XXXX', 1);

            // --engine rust: hand off to the native Rust flasher (stcbsl /
            // stm32bsl) instead of the JS path. Two independent flashers
            // (the differential-oracle habit) and a robustness choice — the
            // Rust ones own termios/tcdrain natively. Only STC and STM32 have
            // a Rust binary today; other families say so and stay on JS.
            if (opts.engine === 'rust') {
                const rustTool = family === 'stc' ? 'stcbsl' : family === 'stm32' ? 'stm32bsl' : null;
                if (!rustTool) die(`--engine rust has no native binary for the '${family}' family yet `
                    + '(STC and STM32 only) — omit --engine to use the built-in JS flasher', 1);
                const cand = [rustTool, `${process.env.HOME}/.cargo/bin/${rustTool}`,
                    `${process.env.HOME}/code/stc/tools/stcbsl/target/release/${rustTool}`,
                    `${process.env.HOME}/.cache/shared-cargo-target/release/${rustTool}`,
                    ...(process.env.CARGO_TARGET_DIR ? [`${process.env.CARGO_TARGET_DIR}/release/${rustTool}`] : [])];
                if (opts['rust-bin']) cand.unshift(opts['rust-bin']);
                const found = cand.find((t) => { try { execFileSync(t, ['--help'], { stdio: 'pipe' }); return true; } catch { return false; } });
                if (!found) die(`${rustTool} not found — build it: `
                    + `cd stc/tools/stcbsl && cargo build --release --bin ${rustTool}, or cargo install --path .`, 1);
                execFileSync(found, ['--port', portPath, 'flash', imagePath], { stdio: 'inherit' });
                console.log(`flashed via ${rustTool} (native Rust)`);
                break;
            }

            const port = nodeSerialPort(portPath);
            const log = (t) => console.log('  ' + t);
            try {
                if (family === 'stm32') {
                    console.error('STM32: set BOOT0 HIGH and reset the board, then continue…');
                    await port.open({ baudRate: 115200, parity: 'even' });
                    const bytes = new Uint8Array(fs.readFileSync(imagePath));
                    const done = await flasher.flashStm32(port, bytes, { log });
                    console.log(`flashed ${done.bytes} bytes to STM32 (id 0x${done.productId.toString(16)}) — running`);
                } else if (family === 'stc') {
                    const hex = fs.readFileSync(imagePath, 'utf8');
                    const done = await flasher.flashStc(port, hex, {
                        log, onPowerCycle: () => console.error('PULL THE POWER and reapply it — the STC ISP only answers after a COLD power-on'),
                        // Interactive cold-cycling through an API/chat can take
                        // longer than the protocol's own 30-second default.
                        timeoutMs: Number(opts.wait ?? 120) * 1000,
                    });
                    console.log(`flashed ${done.bytes} bytes to the STC — running`);
                } else if (family === 'eeprom') {
                    console.error('EEPROM: this flashes a Ben Eater programmer running bweep.ino, '
                        + 'NOT the 6502/Z80 itself — move the burned chip to the board after.');
                    await port.open({ baudRate: 115200 });
                    const bytes = new Uint8Array(fs.readFileSync(imagePath));
                    const done = await flasher.flashEeprom(port, bytes, { log });
                    console.log(`burned ${done.bytes} bytes to the EEPROM and verified`);
                } else if (family === 'avr-mega') {
                    console.error('Mega (STK500v2): needs the adapter to assert DTR on open to enter the bootloader.');
                    const hex = fs.readFileSync(imagePath, 'utf8');
                    const done = await flasher.flashAvrMega(port, hex, { log });
                    console.log(`flashed ${done.bytes} bytes to the ATmega2560 and verified — running`);
                } else { // avr
                    console.error('AVR: this needs the adapter to assert DTR on open (most do). '
                        + 'If it will not sync, use the browser IDE\'s Flash button (no extra software), '
                        + 'or your own programmer tool.');
                    const hex = fs.readFileSync(imagePath, 'utf8');
                    const done = await flasher.flashAvr(port, hex, { log });
                    console.log(`flashed ${done.bytes} bytes to the AVR and verified — running`);
                }
            } catch (e) {
                await port.close().catch(() => {});
                die(`flashing failed: ${e.message}`, 1);
            }
            await port.close().catch(() => {});
            break;
        }

        // ---- Pico / MicroPython (the original path) ---------------------
        let py;
        if (/\.py$/i.test(file)) py = readInput(file);
        else {
            const c = parseBw(maybeRetarget(readInput(file), opts.device || 'pico'));
            const r = c.generateMicroPython();
            if (!r.ok) die(`micropython refused: ${r.reasons.join('; ')}`, 1);
            for (const w of r.warnings || []) console.error(`warning: ${w}`);
            py = r.py;
        }
        // Find the board.
        const ports = opts.port ? [opts.port]
            : fs.readdirSync('/dev').filter((d) => /^cu\.usbmodem/.test(d)).map((d) => `/dev/${d}`);
        if (!ports.length) {
            if (fs.existsSync('/Volumes/RPI-RP2')) {
                die('the Pico is in BOOTSEL mode — copy a MicroPython UF2 onto the RPI-RP2 '
                    + 'volume first (micropython.org/download/RPI_PICO/), then flash again', 1);
            }
            die('no /dev/cu.usbmodem* device — plug the Pico in (running MicroPython), '
                + 'or pass --port', 1);
        }
        // OUR OWN raw-REPL deploy first — no Python anywhere (the product
        // is a Tauri app; the same picoRepl protocol rides its Rust serial
        // there). The transport is a plain file descriptor with stty
        // setting the line discipline — macOS/Linux; on Windows use the
        // app or mpremote.
        const port = ports[0];
        try {
            const sttyFlag = process.platform === 'darwin' ? '-f' : '-F';
            execSync(`stty ${sttyFlag} ${port} 115200 raw -echo`, { stdio: 'pipe' });
            const fd = fs.openSync(port, 'r+');
            const transport = {
                async write(text) { fs.writeSync(fd, text); },
                read() {
                    return new Promise((resolve) => {
                        const buf = Buffer.alloc(4096);
                        fs.read(fd, buf, 0, buf.length, null, (err, n) => {
                            resolve(err || !n ? '' : buf.toString('utf8', 0, n));
                        });
                    });
                },
            };
            const { createPicoRepl } = await import('../src/utils/picoRepl.js');
            const repl = createPicoRepl(transport, { timeoutMs: 8000 });
            const written = await repl.deployMainPy(py);
            fs.closeSync(fd);
            console.log(`deployed main.py (${written} bytes, device-verified) to ${port} and reset — the program is running`);
            break;
        } catch (e) {
            console.error(`bw: direct deploy failed (${e.message}) — trying mpremote`);
        }
        const mpremote = ['mpremote', path.join(os.homedir(), '.local/bin/mpremote')]
            .find((m) => { try { execSync(`${m} version`, { stdio: 'pipe' }); return true; } catch { return false; } });
        if (!mpremote) die('mpremote not found either — pipx install mpremote', 1);
        const tmp = path.join(os.tmpdir(), `bw-flash-${Date.now()}.py`);
        fs.writeFileSync(tmp, py);
        execFileSync(mpremote, ['connect', ports[0], 'fs', 'cp', tmp, ':main.py'], { stdio: 'inherit' });
        execFileSync(mpremote, ['connect', ports[0], 'reset'], { stdio: 'inherit' });
        console.log(`flashed main.py to ${ports[0]} and reset — the program is running`);
        break;
    }

    case 'export-game': {
        // Any source the workshop reads -> blocks -> a playable game project.
        //   bw export-game <file.bw|.txt|.py|.js|.c|.bas|.sb3> --to web|pygame [-o dir|out.zip]
        const file = positional[0] ?? die('export-game needs a file');
        const to = opts.to ?? 'web';
        if (!['web', 'pygame'].includes(to)) die('export-game needs --to web|pygame');
        const { exportGame, loadSb3, loadCreator, zipExport } = await import('../src/game/export.js');
        let input;
        if (/\.sb3$/i.test(file)) input = await loadSb3(fs.readFileSync(file));
        else {
            let code = readInput(file);
            const reader = /\.py$/i.test(file) ? 'pythonToPseudocode' : /\.js$/i.test(file) ? 'javascriptToPseudocode'
                : /\.c$/i.test(file) ? 'cToPseudocode' : /\.(cow|cowgol)$/i.test(file) ? 'cowgolToPseudocode'
                    : /\.(bas|basic)$/i.test(file) ? 'basicToPseudocode' : null;
            if (reader) {
                const { default: read } = await import(`../src/utils/${reader}.js`);
                const r = read(code);
                for (const w of r.warnings || []) console.error(`warning: ${w}`);
                if (r.ok === false || !r.pseudocode) die(`${reader} refused: ${(r.reasons || r.errors || []).join('; ')}`, 1);
                code = r.pseudocode;
            }
            input = await loadCreator(parseBw(code));
        }
        const title = opts.title || path.basename(file).replace(/\.[^.]+$/, '');
        // Costume pixels (touching colour, pixel collisions) need a browser to rasterize SVGs;
        // the shared headless Chromium is used when available, else box geometry.
        const { rasterizeWithChromium } = await import('../src/game/raster-chromium.js');
        const rasterize = opts['no-raster'] ? undefined : async (jobs) => {
            const r = await rasterizeWithChromium(jobs);
            if (!r) console.error('note: no headless Chromium for costume rasters; using box geometry');
            return r;
        };
        const r = await exportGame(input, { target: to, title, allowUnsupported: !!opts['allow-unsupported'], rasterize });
        if (!r.ok) die(`export refused, unsupported blocks:\n  ${r.reasons.join('\n  ')}`, 1);
        for (const [op, e] of Object.entries(r.report.approximate)) console.error(`approximate: ${op} (${e.count}x) — ${e.note}`);
        const out = opts.o || `${r.name}-${to}`;
        if (/\.zip$/i.test(out)) {
            fs.writeFileSync(out, await zipExport(r.files, r.name));
            console.log(`wrote ${out}`);
        } else {
            for (const [rel, data] of Object.entries(r.files)) {
                const p = path.join(out, rel);
                fs.mkdirSync(path.dirname(p), { recursive: true });
                fs.writeFileSync(p, data);
            }
            console.log(`wrote ${Object.keys(r.files).length} files to ${out}/ — ${to === 'web' ? 'open play.html' : 'run: python main.py'}`);
        }
        break;
    }

    default:
        console.error('bw — the BrickWright workshop CLI');
        console.error('  bw check <file.bw>');
        console.error('  bw devices [file.bw]');
        console.error('  bw retarget <file.bw> <device> [-o out.bw]');
        console.error('  bw transpile <file.bw> --to c|cowgol|micropython|python|javascript|sb3 [--device D] [-o out]');
        console.error('               --to cowgol [--target z80-cpm|i8080-cpm|dos|riscv32|eater6502|atmega328p|arduino-nano|atmega168p]');
        console.error('               Cowgol also accepts an authored .sb3 project (without --device).');
        console.error('  bw read <file.c|file.py> [-o out.bw]');
        console.error('  bw compile <file.bw> [--device D] [-o out]');
        console.error('  bw flash <file.bw|file.py> [--port /dev/cu.usbmodemX]');
        console.error('  bw bake-uf2 <file.bw|file.py> --firmware <micropython.uf2> [-o out.uf2]');
        console.error('  bw export-game <file.bw|.py|.js|.sb3> --to web|pygame [--no-raster] [-o dir|out.zip]');
        process.exit(cmd ? 2 : 0);
}
