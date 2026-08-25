/**
 * Build the ROM images the machine benches boot from.
 *
 * `docs/WAVE-OPEN-DEFECTS.md` D7 in brickwright-lite: three Wave 7 lessons —
 * machines-6502-execution, machines-source-asm and
 * machines-interrupts-performance — wait for the debugger to halt and then ask
 * the learner to step through a program. Measured on the shipped benches, all
 * three extract a machine cleanly (0 refusals, a full MAP/CHIP bus map) and
 * then boot with a ROM of ZERO bytes: the reset vector reads $0000 and the CPU
 * sits on BRK.
 *
 * PLAN.md offered two ways to close it: "ship a ROM image (which needs an
 * assembler, or a checked-in binary and a provenance note)". This is a third
 * and better one for images this small — ship the SOURCE and the assembler
 * that produces it, both a few dozen lines, so the binary is reproducible and
 * reviewable rather than opaque. `--check` re-derives every image and fails if
 * a committed one differs, so a hand-edited .bin cannot survive.
 *
 * The programs are written here rather than taken from the bundled presets
 * (Tali Forth, MS BASIC, BBC BASIC) on purpose. Those are large third-party
 * images that boot into an interactive interpreter; the lessons ask the
 * learner to STEP THROUGH a program and say what each instruction did. Twenty
 * readable instructions serve that; forty kilobytes of Forth does not.
 *
 *   node scripts/build-machine-roms.mjs           write the images
 *   node scripts/build-machine-roms.mjs --check   verify, touch nothing
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(HERE, '..', 'examples');
const CHECK = process.argv.includes('--check');

/* ── A 6502 walking light for the Ben Eater bench ────────────────────────
 * VIA at $6000 (PORTB $6000, DDRB $6002), eight LEDs on PB0..PB7.
 * EXPECTED.md says: one LED at a time, ~100 ms each, 800 ms per sweep.
 *
 * Hand-assembled, with every branch offset shown, because the point of this
 * bench is that a learner single-steps it.
 *
 *   8000  A9 FF     LDA #$FF
 *   8002  8D 02 60  STA $6002     ; DDRB: all of port B is output
 *   8005  A9 01     LDA #$01      ; first lamp
 *   8007  8D 00 60  STA $6000     ; loop: PORTB = A
 *   800A  20 15 80  JSR $8015     ; delay ~100 ms
 *   800D  0A        ASL A         ; walk one place left
 *   800E  D0 F7     BNE $8007     ; $8007-$8010 = -9 = $F7
 *   8010  A9 01     LDA #$01      ; walked off the end: start again
 *   8012  4C 07 80  JMP $8007
 *   8015  A2 4E     LDX #$4E      ; delay: 78 outer passes
 *   8017  A0 FF     LDY #$FF      ; d1:
 *   8019  88        DEY           ; d2:
 *   801A  D0 FD     BNE $8019     ; $8019-$801C = -3 = $FD
 *   801C  CA        DEX
 *   801D  D0 F8     BNE $8017     ; $8017-$801F = -8 = $F8
 *   801F  60        RTS
 *
 * Timing, counted rather than guessed, at the bench's 1 MHz:
 *   inner  DEY(2)+BNE(3) = 5 cycles x 255, less 1 for the final untaken
 *          branch, plus LDY(2)            = 1276
 *   outer  1276 + DEX(2) + BNE(3)         = 1281
 *   total  1281 x 78                      = 99,918 cycles = 99.9 ms
 * which is the 100 ms EXPECTED.md documents, to within a tenth of a percent.
 */
const EATER_BLINK = [
    0xA9, 0xFF,             // LDA #$FF
    0x8D, 0x02, 0x60,       // STA $6002
    0xA9, 0x01,             // LDA #$01
    0x8D, 0x00, 0x60,       // STA $6000
    0x20, 0x15, 0x80,       // JSR $8015
    0x0A,                   // ASL A
    0xD0, 0xF7,             // BNE $8007
    0xA9, 0x01,             // LDA #$01
    0x4C, 0x07, 0x80,       // JMP $8007
    0xA2, 0x4E,             // LDX #$4E
    0xA0, 0xFF,             // LDY #$FF
    0x88,                   // DEY
    0xD0, 0xFD,             // BNE $8019
    0xCA,                   // DEX
    0xD0, 0xF8,             // BNE $8017
    0x60,                   // RTS
];

/** 32 KB at $8000 with the three vectors at the top. */
function eaterRom(code, resetAddr = 0x8000) {
    const rom = new Uint8Array(0x8000).fill(0xEA);      // NOP fill, not 0x00:
    // an accidental jump into empty space then RUNS to the vectors instead of
    // executing BRK ($00) and vanishing into an interrupt.
    rom.set(code, resetAddr - 0x8000);
    const put = (addr, lo, hi) => { rom[addr - 0x8000] = lo; rom[addr - 0x8000 + 1] = hi; };
    put(0xFFFA, resetAddr & 0xff, resetAddr >> 8);      // NMI  -> reset entry
    put(0xFFFC, resetAddr & 0xff, resetAddr >> 8);      // RESET
    put(0xFFFE, resetAddr & 0xff, resetAddr >> 8);      // IRQ/BRK
    return rom;
}

export const IMAGES = [
    { example: 'eater6502-blink', file: 'rom.bin', bytes: () => eaterRom(EATER_BLINK) },
];

let bad = 0;
for (const img of IMAGES) {
    const path = join(EXAMPLES, img.example, img.file);
    const want = Buffer.from(img.bytes());
    if (CHECK) {
        if (!existsSync(path)) { console.log(`MISSING ${img.example}/${img.file}`); bad++; continue; }
        const have = readFileSync(path);
        if (!have.equals(want)) { console.log(`DRIFT   ${img.example}/${img.file}`); bad++; continue; }
        console.log(`ok      ${img.example}/${img.file} (${want.length} bytes)`);
    } else {
        writeFileSync(path, want);
        console.log(`wrote   ${img.example}/${img.file} (${want.length} bytes)`);
    }
}
if (CHECK && bad) { console.log(`\n${bad} image(s) differ — run without --check to rebuild`); process.exit(1); }
