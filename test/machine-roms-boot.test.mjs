/* The machine benches boot a program — D7 of brickwright-lite's
 * docs/WAVE-OPEN-DEFECTS.md.
 *
 * Three Wave 7 lessons — machines-6502-execution, machines-source-asm and
 * machines-interrupts-performance — wait for the debugger to halt and then ask
 * the learner to step through a program. Measured on the shipped benches, all
 * three extracted a machine cleanly (ok, zero refusals, a full MAP/CHIP map)
 * and then booted with a ROM of ZERO bytes: the reset vector read $0000 and
 * the CPU sat on BRK. The bus extract was never the problem; there was simply
 * no image.
 *
 * PLAN.md offered "an assembler, or a checked-in binary and a provenance
 * note". scripts/build-machine-roms.mjs is a third answer for images this
 * small: the SOURCE and its assembler live in the repo, so the binary is
 * reproducible and reviewable, and `--check` refuses a hand-edited .bin.
 *
 * WHAT THIS FILE ASSERTS is that the image BOOTS ON THE BENCH IT SHIPS WITH —
 * extracted from the example's own circuit.json, not a preset — and that what
 * it then does matches the behaviour EXPECTED.md documents. A ROM that exists
 * is not a ROM that runs, and a lesson that says "step through the program"
 * needs the second one.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const SB3 = join(import.meta.dirname, '..');
const EXAMPLES = join(SB3, 'examples');
const BOARD = process.env.BW_BOARD || join(SB3, '..', 'bw-board');

const gate = requireSiblings('bw-board');
siblingGuardTest(gate, 'the machine-ROM boot gate');

const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const entryFor = (id) => (Array.isArray(index) ? index : index.examples).find((e) => e.id === id);

describe('machine benches boot the ROM they ship', { skip: gate.skip }, () => {
    test('eater6502-blink ships a ROM, and the index declares it', () => {
        const e = entryFor('eater6502-blink');
        assert.ok(e, 'eater6502-blink is not in the catalog');
        assert.equal(e.files.rom, 'eater6502-blink/rom.bin',
            'the bench must DECLARE its image; a file nobody names is a file nobody loads');
        const rom = readFileSync(join(EXAMPLES, e.files.rom));
        assert.equal(rom.length, 0x8000, '32 KB, the 28C256 the bench draws');
        // The reset vector is the whole difference between this bench and the
        // one that sat on BRK: $FFFC/$FFFD live at the top of the image.
        assert.equal(rom[0x7FFC], 0x00, 'reset vector low byte');
        assert.equal(rom[0x7FFD], 0x80, 'reset vector high byte — $8000');
    });

    test('it boots on the bench extracted from its own circuit, and the LEDs walk', async () => {
        const { default: extract6502Machine } = await import(new URL('src/m6502-extract.js', `file://${BOARD}/`).href);
        const { M6502Machine } = await import(new URL('src/m6502-machine.js', `file://${BOARD}/`).href);

        const data = JSON.parse(readFileSync(join(EXAMPLES, 'eater6502-blink', 'circuit.json'), 'utf8'));
        const r = extract6502Machine(data);
        assert.ok(r.ok, `extraction failed: ${(r.reasons || []).join('; ')}`);
        // The bench the lesson names, not a preset: RAM low, ROM high, VIA at $6000.
        assert.deepEqual(r.regions, [
            { kind: 'ram', start: 0x0000, end: 0x3FFF },
            { kind: 'rom', start: 0x8000, end: 0xFFFF },
        ]);
        assert.deepEqual(r.chips, [{ kind: 'via', name: 'via', at: 0x6000, span: 0x2000 }]);

        const m = new M6502Machine({ clockHz: 1_000_000, regions: r.regions, chips: r.chips });
        m.loadRom(new Uint8Array(readFileSync(join(EXAMPLES, 'eater6502-blink', 'rom.bin'))), 0x8000);
        m.reset?.();
        assert.equal(m.cpu?.pc ?? m.pc, 0x8000,
            'the CPU must come up in the ROM — this is exactly what an empty image got wrong');

        // EXPECTED.md: "LEDs light in sequence PB0 -> PB1 -> ... -> PB7, then
        // back to PB0" and "only one LED is lit at any moment".
        const via = m.chips.via;
        const seen = [];
        let last = null;
        for (let i = 0; i < 3_000_000 && seen.length < 10; i++) {
            m.step();
            if (via.orb !== last) { seen.push(via.orb); last = via.orb; }
        }
        assert.deepEqual(seen.slice(1, 9), [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80],
            'port B must walk one bit at a time');
        assert.equal(seen[9], 0x01, 'and wrap back to PB0');
        for (const v of seen.slice(1)) {
            assert.equal(v & (v - 1), 0, `only one LED at a time; saw 0x${v.toString(16)}`);
        }
    });

    test('each lamp lasts the 100 ms EXPECTED.md documents — counted in cycles', async () => {
        // Cycles, not wall time. The bench runs at 1 MHz, so a cycle count IS
        // the duration, and it cannot go flaky under load — this repo has
        // wall-clock gates that fire falsely on busy machines and they are the
        // reason nothing here uses one.
        const { default: extract6502Machine } = await import(new URL('src/m6502-extract.js', `file://${BOARD}/`).href);
        const { M6502Machine } = await import(new URL('src/m6502-machine.js', `file://${BOARD}/`).href);
        const data = JSON.parse(readFileSync(join(EXAMPLES, 'eater6502-blink', 'circuit.json'), 'utf8'));
        const r = extract6502Machine(data);
        const m = new M6502Machine({ clockHz: 1_000_000, regions: r.regions, chips: r.chips });
        m.loadRom(new Uint8Array(readFileSync(join(EXAMPLES, 'eater6502-blink', 'rom.bin'))), 0x8000);
        m.reset?.();

        const via = m.chips.via;
        const cycles = () => m.cycles ?? m.cpu?.cycles ?? 0;
        const gaps = [];
        let last = null, lastAt = null;
        for (let i = 0; i < 5_000_000 && gaps.length < 8; i++) {
            m.step();
            if (via.orb !== last) {
                if (lastAt !== null && last !== 0) gaps.push(cycles() - lastAt);
                last = via.orb; lastAt = cycles();
            }
        }
        assert.equal(gaps.length, 8, 'expected eight lamp intervals');
        for (const g of gaps) {
            assert.ok(Math.abs(g - 100_000) < 1000,
                `each lamp is ~100,000 cycles at 1 MHz; measured ${g}`);
        }
        const sweep = gaps.reduce((a, b) => a + b, 0);
        assert.ok(Math.abs(sweep - 800_000) < 8000,
            `EXPECTED.md documents an 800 ms sweep; measured ${(sweep / 1000).toFixed(1)} ms`);
    });

    test('eater6502-vdp-hello writes HELLO into the TMS9918 name table', async () => {
        // machines-source-asm's bench. Its program.c was already in the repo and
        // documents every constant; the ROM is that program, hand-assembled with
        // labels rather than counted offsets (four loops — counted offsets are
        // exactly what assembles into something plausible and wrong).
        const e = entryFor('eater6502-vdp-hello');
        assert.equal(e.files.rom, 'eater6502-vdp-hello/rom.bin');
        const { default: extract6502Machine } = await import(new URL('src/m6502-extract.js', `file://${BOARD}/`).href);
        const { M6502Machine } = await import(new URL('src/m6502-machine.js', `file://${BOARD}/`).href);
        const data = JSON.parse(readFileSync(join(EXAMPLES, 'eater6502-vdp-hello', 'circuit.json'), 'utf8'));
        const r = extract6502Machine(data);
        assert.ok(r.ok, `extraction failed: ${(r.reasons || []).join('; ')}`);
        assert.ok(r.chips.some((c) => c.kind === 'vdp' && c.at === 0x4000), 'TMS9918 at $4000');

        const m = new M6502Machine({ clockHz: 1_000_000, regions: r.regions, chips: r.chips });
        m.loadRom(new Uint8Array(readFileSync(join(EXAMPLES, 'eater6502-vdp-hello', 'rom.bin'))), 0x8000);
        m.reset?.();
        assert.equal(m.cpu?.pc ?? m.pc, 0x8000);
        for (let i = 0; i < 2_000_000; i++) m.step();

        const vdp = m.chips.vdp1;
        // The registers the C file sets, read back off the chip.
        assert.equal(vdp.regs[1], 0xC0, 'R1: 16K, display on, no IRQ');
        assert.equal(vdp.regs[2], 0x0E, 'R2: name table at $3800');
        assert.equal(vdp.regs[7], 0xF4, 'R7: white on dark blue');
        // And the text, where the program puts it: row 11, column 13.
        const at = 0x3800 + 11 * 32 + 13;
        const text = [...vdp.vram.slice(at, at + 5)].map((c) => String.fromCharCode(c)).join('');
        assert.equal(text, 'HELLO');
        // The rest of the name table was cleared — 768 cells less the five.
        let spaces = 0;
        for (let i = 0x3800; i < 0x3800 + 768; i++) if (vdp.vram[i] === 0x20) spaces++;
        assert.equal(spaces, 763, 'the clear loop must cover the whole name table');
    });

    test('the committed image is exactly what the generator produces', () => {
        // The whole reason the source ships: a .bin edited by hand, or stale
        // against a changed program, is caught here rather than discovered by
        // a learner stepping into garbage.
        for (const id of ['eater6502-blink', 'eater6502-vdp-hello']) {
            const rom = readFileSync(join(EXAMPLES, id, 'rom.bin'));
            assert.equal(rom.length, 0x8000, `${id}: 32 KB`);
            assert.equal(rom[0x7FFC], 0x00, `${id}: reset vector low`);
            assert.equal(rom[0x7FFD], 0x80, `${id}: reset vector high — $8000`);
            // Unused ROM is NOP-filled, so a stray jump runs to the vectors
            // instead of executing BRK ($00) and vanishing into an interrupt.
            const tail = new Set();
            for (let i = 0x4000; i < 0x7FFA; i++) tail.add(rom[i]);
            assert.deepEqual([...tail], [0xEA], `${id}: unused ROM must be NOP-filled`);
        }
    });

    // ---- z80-pd-bench -----------------------------------------------------
    // The third bench is a DIFFERENT decision from the two 6502 ones, and the
    // difference is the point. The brief named `z80-bench`; measured, that is
    // the wrong bench. Both Z80 examples used to carry the sentence "There is
    // no DEVICE Z80 program axis in the transpiler yet" — false since the Z80
    // core landed. But the axis it grew is narrow: z80Hw() recognises only
    // OUT0-7 / IN0-7 (a 74HC374 latch and a 74HC244 buffer at port 0), and
    // z80-bench's only I/O is an MC6850 ACIA. So z80-bench legitimately stays
    // program-less, and z80-pd-bench — which HAS the '374, the '244 and eight
    // LEDs — is the one that can run.

    test('z80-pd-bench ships a ROM, and the index declares it', () => {
        const e = entryFor('z80-pd-bench');
        assert.ok(e, 'z80-pd-bench is not in the catalog');
        assert.equal(e.files.rom, 'z80-pd-bench/rom.bin',
            'the bench must DECLARE its image; a file nobody names is a file nobody loads');
        const rom = readFileSync(join(EXAMPLES, e.files.rom));
        assert.equal(rom.length, 0x8000, 'the ROM region this board decodes is $0000-$7FFF');
        assert.ok(rom.some((b) => b !== 0x00), 'an all-NOP image is the defect this gate exists for');
    });

    test('the emitter and the extractor agree about the machine', async () => {
        // program.bw and rom.bin describe one board only if the axis the
        // emitter targets is the silicon the extractor finds. Both sides are
        // READ here rather than restated: a port number typed into this test
        // would prove nothing about either.
        const { extractZ80Machine } = await import(join(BOARD, 'src', 'z80-extract.js'));
        const circuit = JSON.parse(readFileSync(join(EXAMPLES, 'z80-pd-bench', 'circuit.json'), 'utf8'));
        const machine = extractZ80Machine(circuit);
        assert.ok(machine.ok, `extraction failed: ${machine.reasons.join('; ')}`);
        const latch = machine.ports.find((p) => p.kind === 'latch');
        const buffer = machine.ports.find((p) => p.kind === 'buffer');
        assert.ok(latch, 'no 74HC374 found — the OUT axis has nothing to drive');
        assert.ok(buffer, 'no 74HC244 found — the IN axis has nothing to read');

        const { default: SB3Creator } = await import('../src/utils/sb3Creator.js');
        const creator = new SB3Creator();
        creator.parse(readFileSync(join(EXAMPLES, 'z80-pd-bench', 'program.bw'), 'utf8'));
        const c = creator.generateC();
        assert.deepEqual(creator.cWarnings ?? [], [],
            'the program must emit for this board with no warnings');
        // The emitted __sfr address must BE the extracted port, not merely
        // resemble it — this is the join between the two halves.
        const outAt = /__sfr\s+__at\s+(0x[0-9a-fA-F]+)\s+BW_PORT_OUT/.exec(c);
        const inAt = /__sfr\s+__at\s+(0x[0-9a-fA-F]+)\s+BW_PORT_IN/.exec(c);
        assert.ok(outAt && inAt, 'the Z80 core must declare both port latches');
        assert.equal(Number(outAt[1]), latch.at, 'BW_PORT_OUT must sit on the extracted latch port');
        assert.equal(Number(inAt[1]), buffer.at, 'BW_PORT_IN must sit on the extracted buffer port');
    });

    test('z80-pd-bench walks one lamp at a time on the machine from its own circuit', async () => {
        const { extractZ80Machine } = await import(join(BOARD, 'src', 'z80-extract.js'));
        const { Z80Machine } = await import(join(BOARD, 'src', 'z80-machine.js'));
        const circuit = JSON.parse(readFileSync(join(EXAMPLES, 'z80-pd-bench', 'circuit.json'), 'utf8'));
        const machine = extractZ80Machine(circuit);
        const rom = readFileSync(join(EXAMPLES, 'z80-pd-bench', 'rom.bin'));

        const m = new Z80Machine(
            { clockHz: 7372800, regions: machine.regions, ports: machine.ports },
            { onBufferRead: () => 0xFF },       // DIP switches open
        );
        m.load(new Uint8Array(rom), 0);

        const latchName = machine.ports.find((p) => p.kind === 'latch').name;
        const seen = [];
        const at = [];
        let last = null;
        // Budgeted in CYCLES, never wall time — a wall-clock budget is
        // load-sensitive and has produced false reds on three machines.
        for (let i = 0; i < 40_000_000 && seen.length < 10; i++) {
            m.step();
            const v = m.chips[latchName].value;
            if (v !== last) { seen.push(v); at.push(m.cycles); last = v; }
        }

        // seen[0] is the '374 powering up at 0; the walk starts after it.
        assert.deepEqual(seen.slice(1), [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x01],
            'one lamp at a time, walking up and wrapping — RLCA, not a counter');

        const perLamp = at.slice(2).map((c, i) => c - at[i + 1]);
        assert.equal(new Set(perLamp).size, 1, 'every lamp must be lit for the same time');
        // 0.1 s at 7,372,800 Hz is 737,280 cycles; the loop lands at 736,147
        // (99.85 ms), 0.15% under. program.bw says `wait 0.1 seconds`, and
        // this is how close the hand-assembled delay gets to it.
        assert.equal(perLamp[0], 736147, 'measured delay loop, from the arithmetic in build-machine-roms.mjs');
        const sweep = at[9] - at[1];
        assert.equal(sweep, 736147 * 8, 'eight lamps make one sweep');
        assert.ok(Math.abs(sweep / 7372800 - 0.8) < 0.005, 'a sweep is ~800 ms, as the program reads');
    });

    test('the z80 image is exactly what the generator produces', () => {
        const rom = readFileSync(join(EXAMPLES, 'z80-pd-bench', 'rom.bin'));
        assert.equal(rom.length, 0x8000, '32 KB');
        // The Z80 resets to $0000, so the program starts at byte 0 — there are
        // no vectors to plant, unlike the 6502 images.
        assert.equal(rom[0], 0x3E, 'first opcode is LD A,n');
        assert.equal(rom[1], 0x01, 'and the first lamp is bit 0');
        // Fill is $00 = NOP on a Z80: a stray jump runs forward harmlessly.
        const tail = new Set();
        for (let i = 0x0100; i < 0x8000; i++) tail.add(rom[i]);
        assert.deepEqual([...tail], [0x00], 'unused ROM must be NOP-filled');
    });

    test('the Z80 program survives the trip through C as the program it was', async () => {
        // The corpus fixed-point gate proves the round trip CONVERGES; it does
        // not prove it converges on the right thing. Measured: with the Z80
        // pin form alone, `turn on l0` came back as `set z80_sh to z80_sh
        // bitor (1 shiftleft 0)` plus a shadow push, and that degraded form is
        // itself a fixed point — so the corpus gate stayed green while the
        // program's meaning was gone. This asserts the meaning.
        //
        // It starts from what the app PRODUCES: program.bw -> generateC ->
        // cToPseudocode. Nothing here is a literal transcribed by hand.
        const { default: SB3Creator } = await import('../src/utils/sb3Creator.js');
        const mod = await import('../src/utils/cToPseudocode.js');
        const cToPseudocode = mod.cToPseudocode || mod.default;

        const source = readFileSync(join(EXAMPLES, 'z80-pd-bench', 'program.bw'), 'utf8');
        const creator = new SB3Creator();
        creator.parse(source);
        const back = cToPseudocode(creator.generateC()).pseudocode;

        const pinLines = (text) => text.split('\n')
            .map((l) => l.trim())
            .filter((l) => /^(turn (on|off)|toggle) l\d$/.test(l));

        const before = pinLines(source);
        assert.ok(before.length >= 16, `the fixture must exercise the pins (${before.length} found)`);
        assert.deepEqual(pinLines(back), before,
            'every turn on / turn off must come back as itself — a shadow-byte '
            + 'read-back is a fixed point too, and it is not this program');
    });

    // ---- eater6502-bench: the interrupt bench (D37) ------------------------
    // machines-interrupts-performance asks for latency, jitter and foreground
    // impact. Its bench was z80-bench, which ships no program; and measured
    // across the gallery, no interrupt-capable device output drives any CPU
    // interrupt input anywhere. The simulator never needed one -- M6502Machine
    // polls every chip's irqAsserted -- so the gap was a PROGRAM, not wiring.

    test('eater6502-bench ships an interrupt ROM with its own IRQ vector', () => {
        const e = entryFor('eater6502-bench');
        assert.equal(e.files.rom, 'eater6502-bench/rom.bin');
        const rom = readFileSync(join(EXAMPLES, e.files.rom));
        assert.equal(rom.length, 0x8000, '32 KB');
        const vec = (a) => rom[a - 0x8000] | (rom[a - 0x8000 + 1] << 8);
        assert.equal(vec(0xFFFC), 0x8000, 'RESET -> $8000');
        // The whole point of this image: IRQ does NOT land on the reset path.
        assert.equal(vec(0xFFFE), 0x8100, 'IRQ -> $8100, a handler of its own');
        assert.notEqual(vec(0xFFFE), vec(0xFFFC), 'an IRQ vector equal to RESET is not a handler');
        assert.equal(rom[0x0106], 0x40, 'the handler ends in RTI');
    });

    test('eater6502-bench actually takes timer interrupts, and they jitter', async () => {
        const { default: extract6502Machine } = await import(join(BOARD, 'src', 'm6502-extract.js'));
        const { M6502Machine } = await import(join(BOARD, 'src', 'm6502-machine.js'));
        const machine = extract6502Machine(
            JSON.parse(readFileSync(join(EXAMPLES, 'eater6502-bench', 'circuit.json'), 'utf8')));
        assert.ok(machine.ok, `extraction failed: ${machine.reasons.join('; ')}`);
        const rom = readFileSync(join(EXAMPLES, 'eater6502-bench', 'rom.bin'));

        const m = new M6502Machine({clockHz: 1e6, regions: machine.regions, chips: machine.chips});
        m.loadRom(new Uint8Array(rom), 0x8000);
        m.reset();
        const via = m.chips.via;
        assert.ok(via, 'no VIA on the bench — there is nothing to raise an interrupt');

        let isr = 0, fg = 0, lastB = via.orb, lastA = via.ora;
        const at = [];
        // Budgeted in instructions, and every number below is in CYCLES.
        for (let i = 0; i < 2_000_000; i++) {
            m.step();
            if (via.orb !== lastB) { isr++; lastB = via.orb; at.push(m.cycles); }
            if (via.ora !== lastA) { fg++; lastA = via.ora; }
        }

        // 1. It interrupts at all. Before this bench existed, nothing in the
        //    gallery did, and the lesson asked the learner to measure it anyway.
        assert.ok(isr > 100, `only ${isr} interrupts — the bench is not interrupting`);
        assert.ok(fg > 0, 'the foreground never ran — a stuck ISR, not a bench');

        // 2. The period is the VIA's, not a number typed here: T1 free-running
        //    reloads from its latch, so it is (latch + 2) = $0FFF + 2 = 4097.
        const periods = at.slice(1).map((c, i) => c - at[i]);
        const mean = periods.reduce((a, b) => a + b, 0) / periods.length;
        assert.ok(Math.abs(mean - 4097) < 1,
            `mean ISR period ${mean.toFixed(2)} is not the T1 period of 4097 cycles`);

        // 3. And it JITTERS, which is the lesson's actual subject. The 6502
        //    finishes the instruction in hand before vectoring, so entry is
        //    quantised by instruction length -- the period is never constant.
        //    A bench with zero jitter would teach the opposite of the truth.
        assert.ok(new Set(periods).size > 1,
            'every period identical — this bench exists to show that latency is a distribution');
        assert.ok(Math.min(...periods) >= 4090 && Math.max(...periods) <= 4104,
            `jitter ${Math.min(...periods)}..${Math.max(...periods)} is wider than instruction `
            + 'quantisation explains — something other than entry latency is moving');

        // 4. Foreground impact. The loop is INC abs (6) + JMP abs (3) = 9
        //    cycles, so an UNINTERRUPTED foreground would advance 4097/9 times
        //    per period. It advances measurably fewer, and that deficit is what
        //    the interrupt costs -- entry (7) + INC (6) + LDA (4) + RTI (6).
        const perIsr = fg / isr;
        const uninterrupted = 4097 / 9;
        assert.ok(perIsr < uninterrupted,
            `foreground ${perIsr.toFixed(2)}/interrupt is not below the uninterrupted `
            + `${uninterrupted.toFixed(2)} — the interrupt appears to cost nothing`);
        const lostCycles = (uninterrupted - perIsr) * 9;
        assert.ok(lostCycles > 10 && lostCycles < 40,
            `the interrupt costs the foreground ${lostCycles.toFixed(1)} cycles, which is not `
            + 'the ~23 that entry + handler + RTI explains');
    });
});
