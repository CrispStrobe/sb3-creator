---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [full-build, binary-counting, bar-graph, lcd, decoupling, reset-circuit, clock-source]
---
## What you see
The complete Ben Eater 6502 breadboard computer as it appears in the real build: W65C02 CPU, 32 KB RAM (62256), 32 KB ROM (28C256), W65C22 VIA, W65C51 ACIA, two 74HC00 NAND decode gates — plus everything the minimal bench omits: a 10-LED bar graph on VIA port A showing a binary counter, an HD44780 LCD on port B, per-chip 100 nF decoupling capacitors, a reset button with pull-up, a power indicator LED, and the 1 MHz clock source.

## Try this
1. Run the program — the bar graph counts in binary (0–255).
2. Press the reset button — the counter restarts from 0.
3. Open the Warnings panel and verify the memory map: RAM $0000–$3FFF, ROM $8000–$FFFF, VIA at $6000, ACIA at $5000.
4. Remove one decoupling cap and observe: the simulation still runs, but on the real bench this causes random crashes from power supply noise.

## What is going on
This build matches the owner's physical breadboard computer. Every chip gets a 100 nF bypass capacitor between its VCC and GND pins, placed as close to the chip as possible — these filter the high-frequency switching noise that digital ICs produce. Without them, the power rail rings and nearby chips misread signals. This is the most common source of "it works sometimes" failures in breadboard builds.

The reset circuit uses a pull-up resistor to hold the CPU's active-low reset pin high during normal operation. Pressing the button pulls it to ground, which restarts the CPU from the reset vector ($FFFC–$FFFD in ROM). The power LED confirms the board has voltage.

## Why it matters
The gap between "works in simulation" and "works on the bench" is almost always power integrity. Decoupling caps, proper reset circuits, and stable clock sources are not optional on real hardware — they are the difference between a computer and a pile of warm chips. This example teaches the habits that make real builds work.

## Go further
- [eater6502-bench](../eater6502-bench) — the minimal version for understanding the architecture.
- [eater6502-contention-bug](../eater6502-contention-bug) — a deliberate wiring error to debug.
- [ttl-clock-module](../ttl-clock-module) — the clock module that generates the 1 MHz square wave.
