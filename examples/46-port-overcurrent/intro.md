---
level: advanced
age: 16+
prereqs: [01-blink]
teaches: [port-current-limit, aggregate-current, chip-protection]
---
## What you see
Eight LEDs are connected to a single STC12 port through 140 Ω resistors and turned on together. At the pinned circuit model, each branch draws about 17.14 mA and remains below the 20 mA per-pin limit, but the eight branches total about 137.14 mA — above the chip's approximately 120 mA I/O budget. Every pin can look acceptable while their sum is not.

## Try this
1. Run the simulation with all eight LEDs on and inspect the branch currents.
2. Add the eight readings: their total crosses the chip budget even though no branch crosses 20 mA.
3. Turn off half the LEDs and confirm the calculated total drops below the budget.

## What is going on
The STC12 datasheet specifies both per-pin and aggregate I/O limits. You can stay within the per-pin limit on every pin and still exceed the chip limit when too many pins sink current simultaneously. Exceeding an absolute maximum can overheat or permanently damage real hardware. The fix is to raise the resistor values or use a transistor or driver IC so the load current does not pass through the MCU pins.

## Why it matters
This is one of the most common beginner mistakes in embedded design. A project works with one or two LEDs but fails mysteriously when scaled up. Understanding aggregate current limits prevents burnt chips and teaches you to read datasheets carefully.

## Go further
- [38-npn-switch](../38-npn-switch) — use a transistor to drive an LED without loading the MCU pin.
- [08-led-chaser-595](../08-led-chaser-595) — use a shift register to drive many LEDs with only a few MCU pins.
- Experiment: look up your MCU's datasheet and find both the per-pin and per-port current limits, then calculate the maximum number of 20 mA LEDs you can drive directly.
