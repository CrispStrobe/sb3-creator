---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [full-build, binary-counting, bar-graph, lcd, 555-clock, address-decode]
---
## What you see
The complete Ben Eater 6502 breadboard computer: W65C02 CPU, RAM, ROM, VIA, ACIA, two NAND decode gates — plus the full-build extras: a 10-LED bar graph on VIA port A showing a binary counter, an HD44780 LCD on port B, and a 555 timer providing the clock.

## Try this
1. Run the program — the bar graph counts in binary (0–255), wrapping around.
2. Watch the count in the serial output alongside the LED pattern.
3. Change the wait time from 0.25 to 0.05 seconds — the count races.
4. Try counting only the lower 4 bits (mod 16 instead of mod 256) — only the first 4 LEDs light.

## What is going on
The VIA's port A drives 8 LEDs through the bar graph. The program increments a counter and uses bit masking (dividing by powers of 2, then mod 2) to extract each bit and drive the corresponding LED. This is how every binary display works — from debugging LEDs to front-panel lights on vintage computers.

The 555 timer generates the clock that drives the CPU. In the real build, slowing the clock lets you watch each bus cycle; here the simulation runs at whatever speed the emulator provides.

## Why it matters
This is the full build — everything a retro computer needs to be useful: a CPU, memory, I/O, a display, and a clock. Understanding how these pieces connect is the foundation of computer engineering. Ben Eater's project has made this accessible to thousands; this simulation lets you experiment without buying chips.

## Go further
- [eater6502-bench](../eater6502-bench) — the minimal version without the extras.
- [eater6502-contention-bug](../eater6502-contention-bug) — a deliberate wiring error to debug.
- Try writing a Knight Rider pattern (LEDs scan left-right) instead of binary counting.
