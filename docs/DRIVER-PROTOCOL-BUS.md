# Part drivers: protocol over bus (the P2 measurement)

`generateC` emits a C driver for each hardware verb, per CPU family. Today a
verb that works on N families is written N times — the SAME device protocol (the
8255 control word, the 74HC595 shift sequence, the HD44780 nibble dance) copied
into each family's helper, differing only in the **bus**: how a pin is driven
(`*dp |= 1<<db` on AVR/6502, `BW_SIO_GPIO_OUT_SET` on the RP2040, a `__sbit`
lvalue on the 8051, `bw_outb` through the 8255 on the 8086). So a new
verb×family cell costs a hand-written driver, and a new family costs one per
verb. This measures how much of that is duplicated protocol, which is the case
for splitting it — **protocol** (part-specific, family-agnostic) over **bus**
(family-specific, part-agnostic).

## Measured

`generateC`'s per-family driver helpers (the `if (this._cUses.V && this._core
=== F)` blocks), classified line by line: a line is **bus** if it names a
family-specific I/O register or primitive (`PORT`/`DDR`/`PIN` on AVR,
`BW_SIO`/`GPIO`, `BW_VIA`, `__sbit`/`__sfr`, `bw_outb`/`bw_inb`, a `volatile
uint8_t *` port pointer, an ADC/timer register); **protocol** otherwise (the
loop, the bit maths, the comments, the sequencing). "Duplicated protocol" is a
protocol line that appears in two or more of a verb's family variants.

| verb | family variants | protocol lines | bus lines | duplicated protocol |
|---|---|---|---|---|
| motor | 4 | 74 | 18 | **46**† |
| tone | 3 | 39 | 2 | **27** |
| servo | 6 | 57 | 7 | **23** |
| shiftOut | 4 (3 bodies) | 28 | 23 | **17** |
| adc | 5 | 35 | 8 | **10** |

† motor was first estimated at 40 by the block-matching sweep, which counted a
collision-check block (it also matches `_cUses.motor &&`) and MISSED the 8051
driver (its branch is an `else if (this._cUses.motor)` with no `&& _core`).
Measured on the four REAL driver blocks after the split, the strict
byte-for-byte duplication is **46** copies (15 lines identical across all four
families — both getters, the speed clamp/store, the dir store/switch skeleton,
the two statics). The refinement raises the multi-variant floor, it does not
lower it.

The multi-variant verbs alone carry **123 duplicated protocol lines** by this
classification (the table's last column, with the refined motor row) — a device
sequence hand-copied across families, kept in sync by hand.

Two methods, so the number is not cherry-picked:

- **Strict floor — 79 lines (sweep) / higher per verb.** Count only lines that
  are *byte-for-byte identical* across two or more of a verb's family helper
  blocks (no classification, no judgement). Bus lines name different registers
  per family and so are almost never identical, which makes this a lower bound.
  The whole-corpus sweep found **79** identical copies — but that sweep's block
  matcher both over- and under-counts per verb (see the motor footnote), so the
  precise per-verb figures measured at conversion time run higher (shiftOut and
  motor together already account for 46 + 17 by exact block diff).
- **Protocol-classified — 123 lines.** Classify each line bus/protocol (the
  rule above), then count protocol lines that recur across family blocks — this
  catches near-copies that differ only in whitespace or a comment but are the
  same protocol step. Broken down in the table.

So the duplicated-protocol figure is **~80–123** depending on how strictly you
count; both are the same story. The single-family verbs (relay, neopixel, lcd,
oled, tft, matrix, sevenseg, ledbank, cube, keypad, sensor, ultrasonic — all
8051-only today) have no cross-family duplication yet, but every one is a driver
that will be copied the first time it gains a second family. That is the
recurring cost P2 removes.

**The number is the case FOR P2**: ~80–123 duplicated lines is not a rounding
error, and it grows with every family × verb the matrix opens. Splitting
protocol from bus turns "add a family to a verb" from "re-copy the driver" into
"add one bus primitive", and "add a verb to a family" into "write the protocol
once".

## The shift_out worked example (the smallest proof)

`shift_out` (verb `stc12_setpart`, the 74HC595) is the cleanest case: four
families (avr, 6502, arm, 8051 — 6502 shares avr's body), one algorithm. The
**protocol** is identical in structure across all of them:

```
latch low
for 8 bits:
    clock low
    set data = the top bit (inverted if active-low)
    value <<= 1
    clock high            # shift on the rising edge
latch high                # make the byte visible
```

The **bus** is the only thing that changes — six pin operations and the
function signature:

| bus op | avr / 6502 | arm (RP2040) | 8051 |
|---|---|---|---|
| signature pin | `volatile uint8_t *dp, uint8_t db` | `uint8_t data_gpio` | `__sbit data_pin` |
| clear a pin | `*cp &= (uint8_t)~(1 << cb)` | `BW_SIO_GPIO_OUT_CLR = (1UL << clock_gpio)` | `clock_pin = 0` |
| set a pin | `*dp \|= (uint8_t)(1 << db)` | `BW_SIO_GPIO_OUT_SET = (1UL << data_gpio)` | `data_pin = 1` |

The proof: `shift_out` becomes **one protocol body over four bus primitives**,
emitting **byte-identical** C for every existing family (a golden test on the
corpus programs asserts the emitted bytes do not move), and then the 8086 bus
primitive is added on top — the same protocol, its pin ops routed through
`bw_outb` and the port shadow — so `shift_out` becomes the **second cell of the
i8086 column** (the matrix goes 56 → 57 of 147), proven on the bench by the
consuming project's differential. No new protocol was written for the 8086; only
its bus.

Scope of this measurement: it counts the per-family HELPER definitions. Some
verbs also emit family-specific code inline in their opcode case (the pin
primitives, the whole-port writes); those follow the same protocol/bus shape and
are folded in as each verb is converted. shift_out is converted here as the
pattern; the rest follow verb by verb, each gated by the same golden test so no
emitted byte moves until a family is deliberately added.

## Landed, verb by verb (largest duplication first)

Each verb is split on its own commit: one protocol body over per-family bus,
a golden test pinning every existing family's pre-refactor bytes, and an i8086
bus variant ONLY where the 8086 has the primitive and the DOS bench has the part
to prove it. The parts matrix count moves only when a cell is proved on the bench.

- **shiftOut** — done. One protocol (MSB-first shift + latch) over four bus
  primitives (avr/6502/arm/8051), byte-identical; the i8086 bus added on top
  through `bw_outb`, so shiftOut is the second i8086 cell and the matrix moved
  56 → 57. Bench differential reconstructs the transmitted byte at each clock
  edge. (`test/shiftout-golden.test.mjs`, `test/i8086-cgen.test.mjs`.)
- **motor** — done (this commit). The L293D driver — `bw_motor_speed`,
  `bw_motor_get_speed`, `bw_motor_dir`, `bw_motor_get_dir` — becomes one protocol
  body over four bus primitives (arm, avr-Mega, avr-Uno, 8051). The two getters
  are byte-identical everywhere; speed differs only in the PWM pin it hands to
  `pwm_set`; dir differs only in how IN1/IN2 are set up and driven. Byte-identical
  for all four (`test/motor-golden.test.mjs`); the shared protocol body is written
  once instead of four times (≈23 lines × 3 copies removed; net −17 source lines
  after the four bus descriptors). **No i8086 cell**: motor needs a PWM source and
  an H-bridge, and the 8086 back end has neither a `pwm_set` primitive nor a bench
  part (the only "motor" on the DOS bench is the floppy spindle on the UPD765,
  unrelated) — so motor stays a measured gap in the 8086 column, not a promise.
- **tone** — next (27 duplicated lines, 3 variants).
