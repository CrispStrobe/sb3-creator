---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [full-build, lcd-4bit, ps2-keyboard, acia-serial, decoupling, reset-circuit]
---
## What you see
The complete Ben Eater 6502 breadboard computer with the BeebEater peripheral wiring: W65C02 CPU, 16 KB RAM (62256, lower half), 32 KB ROM (28C256), W65C22 VIA with HD44780 LCD in 4-bit mode on PORTB and PS/2 keyboard interface on PORTA, W65C51 ACIA at 115200 baud with 1.8432 MHz crystal, two 74HC00 NAND decode gates, per-chip decoupling caps, reset button, and a 1 MHz clock oscillator.

This is the same circuit that runs BeebEater (chelsea6502, MIT) — and later, the shippable MIT MS-BASIC ROM.

## Try this
1. Run the smoke program — the ACIA serial console counts from 0 to 255.
2. Press reset — the counter restarts from 0.
3. Check the Warnings panel: RAM $0000–$3FFF, ROM $8000–$FFFF, VIA $6000, ACIA $5000.
4. Remove one decoupling cap — the sim still runs, but on real hardware this causes noise crashes.

## What is going on
The peripheral wiring follows the BeebEater convention (chelsea6502/BeebEater, MIT):
- **VIA PORTB** (pins 10–16): HD44780 LCD in 4-bit mode. PB0–PB2 are RS, RW, E; PB4–PB7 are D4–D7. PB7 must be tied to GND when the LCD is disconnected.
- **VIA PORTA** (pins 2–9): the modeled PS/2 keyboard interface's eight-bit scan-code latch. Its data-available edge reaches CA1 for interrupt-driven input.
- **ACIA**: 115200 baud serial at $5000, driven by a 1.8432 MHz external crystal. DCDB and DSRB tied to GND to prevent spurious IRQs.

The address decode is the canonical Eater NAND logic: ~A15 gates the lower half (RAM + I/O), A15 gates ROM. Within the lower half, A14+A13 select the VIA, A12 selects the ACIA, and the rest is RAM.

**Errata from the KiCad schematics** (tebl/BE6502, MIT): the real build needs a dedicated reset circuit with a capacitor for power-on delay (a bare button bounces and can leave the CPU in an undefined state), and pull-ups on the bus control lines (RWB, BE) to keep them defined during reset. This simulation assumes clean edges — on the bench, add the RC reset and the pull-ups.

The debugger's bus trace view is the software equivalent of tebl's Arduino Mega bus-monitor shield: both capture address, data, and control signals cycle by cycle — one on a logic analyser, the other in the browser.

## Why it matters
This circuit is the platform for BBC BASIC, Forth, and eventually a full operating system. Understanding the peripheral wiring — which port drives the LCD, which drives the keyboard, how the ACIA baud rate is set by the crystal — is what turns a CPU into a usable computer.

## Go further
- [eater6502-bench](../eater6502-bench) — the minimal version for architecture study.
- [eater6502-contention-bug](../eater6502-contention-bug) — debug a broken address decode.
- [ttl-clock-module](../ttl-clock-module) — build the clock that drives this CPU.
