---
level: advanced
age: 16+
prereqs: [01-blink]
teaches: [port-current-limit, aggregate-current, chip-protection]
---
## What you see
Eight LEDs connected to a single MCU port, all turned on at once. Each LED draws about 20 mA, totalling 160 mA — but the port is only rated for 100 mA aggregate. The simulation shows the aggregate current exceeding the chip's absolute maximum, a condition that would damage real hardware.

## Try this
1. Run the simulation with all eight LEDs on and read the total port current.
2. Turn off half the LEDs and confirm the total drops to a safe level.
3. Add a transistor driver to one LED and observe that its current no longer counts against the port limit.

## What is going on
Every microcontroller datasheet specifies two current limits: per-pin (typically 20 mA) and per-port (typically 100 mA). You can stay within the per-pin limit on every pin and still exceed the per-port limit if too many pins source current simultaneously. Exceeding the aggregate limit causes the chip to overheat, voltage regulators to sag, and in extreme cases, bond wires inside the package to fuse. The fix is to use transistors or driver ICs for high-current loads so the current flows from the supply, not through the chip.

## Why it matters
This is one of the most common beginner mistakes in embedded design. A project works with one or two LEDs but fails mysteriously when scaled up. Understanding aggregate current limits prevents burnt chips and teaches you to read datasheets carefully.

## Go further
- [38-npn-switch](../38-npn-switch) — use a transistor to drive an LED without loading the MCU pin.
- [08-led-chaser-595](../08-led-chaser-595) — use a shift register to drive many LEDs with only a few MCU pins.
- Experiment: look up your MCU's datasheet and find both the per-pin and per-port current limits, then calculate the maximum number of 20 mA LEDs you can drive directly.
