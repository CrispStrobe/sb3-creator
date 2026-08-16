# z80-pd-bench — what this bench really does

Transcribed from PainfulDiodes/z80-breadboard-computer (MIT). The full
pin-level netlist, reconciled between the KiCad schematics and the
project's README-DETAILED, lives in the hardware lab's
`docs/Z80-BENCH-PAINFULDIODES.md`; this file says only what the bench
in front of you does and does not do.

## What the app really gets from this circuit

`extractZ80Machine` reads the wiring and returns, with **zero
refusals**:

```
MAP RAM $8000-$FFFF
MAP ROM $0000-$7FFF
```

No `CHIP` line. That is the honest result, not an omission — see
"The serial face is missing" below. `check-extract.mjs` in this
directory asserts exactly those two lines; run it with
`node examples/z80-pd-bench/check-extract.mjs`.

## Faithful

- **The memory map.** ROM selected for the whole low 32K, RAM for the
  whole high 32K, decoded from /MREQ and A15 alone — the original's
  rule, gate for gate.
- **The port decode.** `/RD_PORT_0`, `/RD_PORT_1` and `WR_PORT_1` are
  produced on the board from /IORQ, /RD, /WR and A0, including the
  original's two quirks: **A0 alone** distinguishes the two ports (so
  every even port is port 0 and every odd port is port 1), and **A0 is
  not decoded on writes at all** (so `OUT` to any port hits port 1).
  The final inversion to an active-**high** write strobe is there too,
  because that is what the FIFO wants and it is the reason the real
  build carries an inverter package.
- **/OE on both memories rides the CPU's /RD**, so nothing drives the
  bus outside a read — which is also why Z80 refresh cycles, which
  assert /MREQ with neither /RD nor /WR, are harmless here.
- **ROM /WE tied to +5 V.** The EEPROM is programmed off-board; the
  machine must not be able to write to it.
- **/INT, /NMI, /WAIT, /BUSRQ tied high**; /HALT, /BUSACK, /M1, /RFSH
  deliberately unconnected, exactly as upstream leaves them.
- **The reset network**: 10 kΩ pull-up, 100 nF to ground, and a 220 Ω
  resistor in series with the button so pressing it discharges the
  capacitor at a limited rate. Z80 /RESET is **active low**.

## Approximated — and why

**1. The ROM is a 32K 28C256, not the original's 8K AT28C64B.**
No 8K parallel EEPROM part exists in the engine. The substitution is
*visible in one place only*: on the real machine the 8K image
**aliases four times** across the low 32K, because A13 and A14 never
reach the ROM, so the same byte answers at `$0000`, `$2000`, `$4000`
and `$6000`. Here the 32K part fills the window for real. The **decode
is unchanged** — `/ROM_CE` still covers `$0000-$7FFF` either way — and
the upstream author says himself that an AT28C256 "would drop straight
in and only require connecting up A13 and A14", which is precisely
what this bench does.

**2. The glue is 74HC00 NAND, not the original's 74LS32 OR + 74LS04
inverters.** The app's Z80 extractor understands exactly one glue
family — quad NAND (74HC00/74HC132) — and treats every other chip as
absent, which would leave the chip selects undriven and refuse the
whole circuit. So the *logic* is reproduced exactly and the *packages*
are not. The cost is visible and worth pointing at: the original needs
nine gates in three packages (six OR, three inverters); the NAND-only
realization needs fourteen in four, because every inversion costs a
whole gate. Which decode is on the board is identical; which chips
implement it is not.

**3. There is no clock oscillator part.** The original has an
ECS-2200B-100 10 MHz can driving pin 6. The app clocks the emulated
CPU itself, and no oscillator device exists in the engine, so `clk` is
left unwired rather than faked with a 555.

**4. Two breadboards, not the original's nine.** The upstream build
spreads across nine boards with a dedicated component-free backplane
in the middle; the seating generator packs the same parts onto two.
Layout is not being claimed here — wiring is.

## The serial face is missing, and it is flagged, not faked

The machine's only I/O device is an **FTDI UM245R** parallel USB FIFO,
with a 74LS244 buffering /TXE and /RXF onto the data bus as a
readable status byte. **Neither part exists in the engine**: there is
no FIFO/byte-pipe device and no 74HC244.

Nothing was substituted for them. In particular the MC6850 ACIA was
**not** dropped in — that would have quietly turned this design into a
copy of the catalog's other Z80 bench and erased the exact difference
this example exists to show. The UM245R is not an ACIA: it has no baud
rate, no shift register and no framing; it is a byte queue with two
flags, chosen by the original author *because* an FTDI cable driving a
6850 loses data.

So, concretely:

- The three port strobes are generated and correct, and end at
  unconnected gate outputs.
- Port reads and writes do nothing. **The machine boots and runs from
  ROM; it cannot say anything.**
- When a `um245r` engine part lands, it drops onto those three strobes
  and D0-D7 with no rewiring, and the extractor gains a `CHIP` line.
  The part's required behaviour is specified in the hardware lab's
  `docs/Z80-BENCH-PAINFULDIODES.md` §8 — including the one thing a
  naive model gets wrong: **reading an empty FIFO returns the last
  byte again**, not zero, which is why the status byte must be tested
  first.

## One unresolved fact, recorded rather than papered over

The upstream schematic and the upstream prose **disagree about the
status byte's bit order**. The schematic wires /TXE to D0 and /RXF to
D1; README-DETAILED says the opposite ("/RXF as bit 0 and /TXE as bit
1"). The tie-breaker is the companion monitor's `UM245R.asm`, which is
not in our corpus. Nothing in this bench depends on the answer yet —
but whoever builds the `um245r` part must pick a side and say so.
