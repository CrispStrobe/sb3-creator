---
level: advanced
age: 14+
prereqs: [pc45-nand-test, pc69-nand-inverter]
teaches: [NAND-gate, SR-latch, debounce, contact-bounce]
---
## What you see
Two NAND gates cross-coupled as an RS latch — the classic debounced switch. Press Set: the LED turns on cleanly with no flicker. Press Reset: it turns off cleanly.

## Try this
1. Click **Sim** — the LED is off.
2. Press Set — the LED turns on, a single clean transition.
3. Press Reset — the LED turns off.
4. Mechanical buttons normally bounce (multiple on/off transitions in milliseconds). The latch filters this: the first contact sets the output, and bounces cannot change it.

## What is going on
Each NAND gate has one input pulled HIGH through a resistor. A button press pulls that input LOW. A NAND with one LOW input outputs HIGH, which drives the other gate's input. The cross-feedback latches the state — further pulses on the same input cannot change the output. Only a pulse on the other input flips the latch back.

## Go further
- [pc45-nand-test](../pc45-nand-test) — NAND truth table.
- [pc63-555-bistabil](../pc63-555-bistabil) — another kind of flip-flop (555-based).
- [pc59-nor-memory](../pc59-nor-memory) — the same latch principle with NOR gates.
