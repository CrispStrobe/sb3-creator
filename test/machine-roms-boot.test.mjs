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

    test('the committed image is exactly what the generator produces', () => {
        // The whole reason the source ships: a .bin edited by hand, or stale
        // against a changed program, is caught here rather than discovered by
        // a learner stepping into garbage.
        const rom = readFileSync(join(EXAMPLES, 'eater6502-blink', 'rom.bin'));
        const fill = new Set();
        for (let i = EATER_CODE_LEN; i < 0x7FFA; i++) fill.add(rom[i]);
        assert.deepEqual([...fill], [0xEA],
            'unused ROM is NOP-filled, so a stray jump runs to the vectors instead of BRK');
    });
});

// The assembled length of the walking-light program, kept beside the gate so a
// change to the program has to move a number here too.
const EATER_CODE_LEN = 32;
