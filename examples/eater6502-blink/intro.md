---
level: intermediate
age: 14+
prereqs: []
teaches: [6502-basics, via-gpio, retro-computing]
---
## What you see
An LED on VIA port A bit 0 (PA0) blinks on and off once per second. This is the simplest program for the 6502 breadboard computer — the "Hello World" of retro computing.

## Try this
1. Run the program and watch the LED blink at 1 Hz.
2. Change the wait time to 0.1 seconds — the blink speeds up.
3. Add a second LED on PA1 and make them alternate.

## What is going on
The 6502 CPU writes to the W65C22 VIA's output register at address $6000. Setting bit 0 high drives PA0 high (5 V through the resistor and LED to ground). Setting it low turns the LED off. The cooperative scheduler yields at each wait, letting the timebase (Timer 0 at FOSC/12) keep time.

## Why it matters
This is the starting point for every retro computer project. If the LED blinks, the CPU is running, the address decode works, and the VIA is responding.

## Go further
- [eater6502-bench](../eater6502-bench) — the full breadboard computer with RAM, ROM, and address decode.
- [eater6502-contention-bug](../eater6502-contention-bug) — a wiring error exercise.
