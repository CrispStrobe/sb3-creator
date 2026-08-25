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

// ---------------------------------------------------------------------------
// z80-pd-bench — the walking light on the '374 latch.
//
// The bench's own I/O is the pair bw-board's extractor reports at port 0:
// latch1 (74HC374, write-strobed, LEDs led0..led7 on Q0..Q7) and in1
// (74HC244, read-strobed, the DIP switches). That is exactly the axis
// sb3Creator's Z80 core emits for -- `OUT0-7` / `IN0-7`, `BW_PORT_OUT` at
// __sfr __at 0x00 -- so program.bw and this image describe one machine.
//
// Hand-assembled rather than compiled: the emitted C is `sdcc -mz80`, and
// SDCC is GPL and not in CI. The contract held here is BEHAVIOURAL -- the
// image does what program.bw says (one lamp at a time, 0.1 s each), not
// instruction-for-instruction what SDCC would emit for it.
//
// Delay arithmetic, at the SEARLE-lineage 7,372,800 Hz (T-states):
//   inner DJNZ with B=0 -> 255*13 + 8            = 3323
//   outer body = LD B(7) + inner + DEC C(4)      = 3334, +12 when JR taken
//   C=220 -> 219*3346 + 3341                     = 736,115
//   + OUT(11) + LD C(7) + RLCA(4) + JP(10)       = 736,147
// Measured on the core: 736,147 cycles/lamp = 99.847 ms; a sweep of eight
// is 5,889,176 cycles = 798.8 ms. (The 6502 bench's is 99,940 / 799.5 ms --
// the two benches are deliberately comparable.)
const Z80_PD_WALK = [
    0x3E, 0x01,             // $0000  LD A,$01      first lamp
    0xD3, 0x00,             // $0002  loop: OUT ($00),A   latch1 <- A
    0x0E, 0xDC,             // $0004  LD C,220      outer count
    0x06, 0x00,             // $0006  outer: LD B,0 inner count = 256
    0x10, 0xFE,             // $0008  inner: DJNZ inner   (-2)
    0x0D,                   // $000A  DEC C
    0x20, 0xF9,             // $000B  JR NZ,outer   ($0006 - $000D = -7)
    0x07,                   // $000D  RLCA          walk the bit, 80 -> 01
    0xC3, 0x02, 0x00,       // $000E  JP loop
];

/** 32 KB at $0000 -- the region extractZ80Machine reads off this board.
 *  Filled with $00, which on a Z80 is NOP: a jump into empty space runs
 *  forward harmlessly instead of trapping, the same reasoning as the
 *  6502 image's $EA fill. The Z80 resets to PC=$0000, so there are no
 *  vectors to plant. */
function z80Rom(code) {
    const rom = new Uint8Array(0x8000);
    rom.set(code, 0);
    return rom;
}

// ---------------------------------------------------------------------------
// eater6502-bench -- the interrupt bench (D37).
//
// machines-interrupts-performance asks the learner to measure interrupt
// latency, service time, jitter and FOREGROUND IMPACT. Its bench used to be
// z80-bench, which ships no program at all; and the corpus-wide fact behind
// that (measured, see docs/WAVE-OPEN-DEFECTS.md D37) is that no interrupt-
// capable device output drives any CPU interrupt input anywhere in the
// gallery. The simulator does not need one -- M6502Machine polls every chip's
// irqAsserted -- so what was missing was never wiring, it was a PROGRAM.
//
// This is that program, and it is built to be contrasted rather than merely
// watched: the FOREGROUND increments port A in a tight loop, the ISR
// increments port B. Two counters advancing at two rates on one machine is
// exactly the "what does the interrupt cost the foreground" question the
// lesson asks, and both are visible in the debugger without any instrument
// the bench does not already have.
//
// The VIA's T1 in free-run mode reloads from its latch, so the period is
// (latch + 2) cycles: $0FFF -> 4097 cycles = 4.097 ms at the Eater's 1 MHz.
// The ISR clears the T1 flag by READING T1C-L, which is the '22's documented
// acknowledge; forgetting it leaves IFR set and the CPU re-enters for ever,
// which is itself worth stepping into once.
const VIA = 0x6000;         // ORB; +1 ORA, +2 DDRB, +3 DDRA, +4/5 T1C, +B ACR, +D IFR, +E IER
const EATER_IRQ_RESET = 0x8000;
const EATER_IRQ_ISR = 0x8100;

const EATER_IRQ = [
    0xA9, 0xFF,             // LDA #$FF
    0x8D, 0x02, 0x60,       //   STA $6002   DDRB: port B all output
    0x8D, 0x03, 0x60,       //   STA $6003   DDRA: port A all output
    0xA9, 0x00,             // LDA #$00
    0x8D, 0x00, 0x60,       //   STA $6000   ORB = 0  (ISR counter)
    0x8D, 0x01, 0x60,       //   STA $6001   ORA = 0  (foreground counter)
    0xA9, 0x40,             // LDA #$40
    0x8D, 0x0B, 0x60,       //   STA $600B   ACR: T1 free-running
    0xA9, 0xC0,             // LDA #$C0
    0x8D, 0x0E, 0x60,       //   STA $600E   IER: set + T1  -> T1 may interrupt
    0xA9, 0xFF,             // LDA #$FF
    0x8D, 0x04, 0x60,       //   STA $6004   T1C-L (latch low)
    0xA9, 0x0F,             // LDA #$0F
    0x8D, 0x05, 0x60,       //   STA $6005   T1C-H -> latches, clears IFR, RUNS
    0x58,                   // CLI          the interrupt is armed from here
    0xEE, 0x01, 0x60,       // fg: INC $6001  foreground work, on port A ($8025)
    0x4C, 0x25, 0x80,       //     JMP fg     -- $8025, the INC, NOT the CLI at
                            //     $8024: jumping one byte earlier re-runs CLI
                            //     every pass. Harmless, but it makes the
                            //     foreground period 11 cycles instead of a
                            //     clean INC(6) + JMP(3) = 9, and this bench
                            //     exists so that number can be reasoned about.
];

const EATER_IRQ_HANDLER = [
    0xEE, 0x00, 0x60,       // INC $6000    service: ISR work, on port B
    0xAD, 0x04, 0x60,       // LDA $6004    read T1C-L -- the '22's T1 acknowledge
    0x40,                   // RTI
];

/** 32 KB at $8000 with the three vectors at the top. */
function eaterRom(code, resetAddr = 0x8000, opts = {}) {
    const rom = new Uint8Array(0x8000).fill(0xEA);      // NOP fill, not 0x00:
    // an accidental jump into empty space then RUNS to the vectors instead of
    // executing BRK ($00) and vanishing into an interrupt.
    rom.set(code, resetAddr - 0x8000);
    // A second blob, placed at its own address. The IRQ handler lives apart
    // from the reset path so the vector points at a fixed, readable address
    // rather than at whatever offset the main program happens to end on.
    if (opts.at) for (const [addr, blob] of Object.entries(opts.at)) {
        rom.set(blob, Number(addr) - 0x8000);
    }
    const put = (addr, lo, hi) => { rom[addr - 0x8000] = lo; rom[addr - 0x8000 + 1] = hi; };
    const irq = opts.irqAddr ?? resetAddr;
    put(0xFFFA, resetAddr & 0xff, resetAddr >> 8);      // NMI  -> reset entry
    put(0xFFFC, resetAddr & 0xff, resetAddr >> 8);      // RESET
    put(0xFFFE, irq & 0xff, irq >> 8);                  // IRQ/BRK
    return rom;
}

/* ── A tiny label-resolving emitter ──────────────────────────────────────
 * The walking light above is short enough to hand-count. The VDP program is
 * not — ~80 bytes with four loops — and hand-counted branch offsets are
 * exactly the kind of thing that assembles into something plausible and
 * wrong. So the longer programs are written with labels and the offsets are
 * computed, which is what an assembler is for.
 */
function asm(org, write) {
    const out = [];
    const labels = new Map();
    const fixups = [];
    const api = {
        label: (n) => labels.set(n, org + out.length),
        b: (...bytes) => out.push(...bytes),
        /** relative branch to a label (resolved after the pass) */
        rel: (op, name) => { out.push(op, 0); fixups.push({ at: out.length - 1, name, from: org + out.length }); },
        /** absolute address operand to a label */
        abs: (op, name) => { out.push(op, 0, 0); fixups.push({ at: out.length - 2, name, abs: true }); },
    };
    write(api);
    for (const f of fixups) {
        const target = labels.get(f.name);
        if (target === undefined) throw new Error(`undefined label ${f.name}`);
        if (f.abs) { out[f.at] = target & 0xff; out[f.at + 1] = target >> 8; }
        else {
            const d = target - f.from;
            if (d < -128 || d > 127) throw new Error(`branch to ${f.name} out of range (${d})`);
            out[f.at] = d & 0xff;
        }
    }
    return out;
}

/* ── "HELLO" on a TMS9918, the 6502 of examples/eater6502-vdp-hello/program.c
 * Machine: EATER6502 + TMS9918 at $4000 (DATA $4000, CTRL $4001).
 * Every constant below is the one the C file already documents: Graphics I,
 * name table $3800 (R2=$0E), colour table $2000 (R3=$80), patterns $0000
 * (R4=$00), white on dark blue (R7=$F4), text at row 11 column 13.
 */
const VDP_DATA = 0x4000, VDP_CTRL = 0x4001;
const VDP_HELLO = asm(0x8000, (a) => {
    const wreg = (reg, val) => {            // CTRL = val ; CTRL = $80|reg
        a.b(0xA9, val, 0x8D, VDP_CTRL & 0xff, VDP_CTRL >> 8);
        a.b(0xA9, 0x80 | reg, 0x8D, VDP_CTRL & 0xff, VDP_CTRL >> 8);
    };
    const setAddr = (addr) => {             // CTRL = lo ; CTRL = $40|hi
        a.b(0xA9, addr & 0xff, 0x8D, VDP_CTRL & 0xff, VDP_CTRL >> 8);
        a.b(0xA9, 0x40 | ((addr >> 8) & 0x3f), 0x8D, VDP_CTRL & 0xff, VDP_CTRL >> 8);
    };
    const putData = (v) => a.b(0xA9, v, 0x8D, VDP_DATA & 0xff, VDP_DATA >> 8);

    wreg(0, 0x00); wreg(1, 0xC0); wreg(2, 0x0E);
    wreg(3, 0x80); wreg(4, 0x00); wreg(7, 0xF4);

    setAddr(0x2000);                        // colour table: 32 x $F4
    a.b(0xA2, 0x20);                        // LDX #$20
    a.label('fillcol');
    putData(0xF4);
    a.b(0xCA);                              // DEX
    a.rel(0xD0, 'fillcol');                 // BNE fillcol

    setAddr(0x3800);                        // name table: 768 spaces = 3 x 256
    a.b(0xA2, 0x03);                        // LDX #$03
    a.label('clr_outer');
    a.b(0xA0, 0x00);                        // LDY #$00
    a.label('clr_inner');
    putData(0x20);
    a.b(0x88);                              // DEY
    a.rel(0xD0, 'clr_inner');
    a.b(0xCA);                              // DEX
    a.rel(0xD0, 'clr_outer');

    setAddr(0x3800 + 11 * 32 + 13);         // row 11, column 13
    for (const ch of 'HELLO') putData(ch.charCodeAt(0));

    a.label('spin');
    a.abs(0x4C, 'spin');                    // JMP spin — the VDP scans by itself
});

export const IMAGES = [
    { example: 'eater6502-blink', file: 'rom.bin', bytes: () => eaterRom(EATER_BLINK) },
    { example: 'eater6502-vdp-hello', file: 'rom.bin', bytes: () => eaterRom(VDP_HELLO) },
    { example: 'z80-pd-bench', file: 'rom.bin', bytes: () => z80Rom(Z80_PD_WALK) },
    { example: 'eater6502-bench', file: 'rom.bin', bytes: () => eaterRom(EATER_IRQ, EATER_IRQ_RESET,
        {irqAddr: EATER_IRQ_ISR, at: {[EATER_IRQ_ISR]: EATER_IRQ_HANDLER}}) },
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
