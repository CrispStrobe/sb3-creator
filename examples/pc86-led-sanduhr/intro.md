---
level: advanced
age: 14+
prereqs: [pc81-led-lauflicht]
teaches: [tilt-sensor, 555-timer, CD4017, hourglass, sequential-fill]
---
## What you see
An LED hourglass: six LEDs fill up one by one — like grains of sand falling. A 555 timer clocks the CD4017 at ~1 Hz. Tilt the sensor to flip the hourglass — the LEDs clear and filling starts over.

## Try this
1. Click **Sim** — the LEDs fill one per second.
2. After six seconds all are lit — the hourglass is "full."
3. Activate the tilt sensor (flip the hourglass) — all LEDs go dark and it starts again.

## What is going on
The 555 in astable mode (R₁=10 kΩ, R₂=68 kΩ, C=10 µF → f ≈ 1 Hz) clocks the CD4017. Each clock pulse lights the next output. The tilt sensor is on the counter's reset pin: tilting clears all outputs. The counter only counts to 5 (q6 triggers reset).

## Go further
- [pc81-led-lauflicht](../pc81-led-lauflicht) — chaser instead of fill.
- [pc63-555-bistabil](../pc63-555-bistabil) — the timer as a memory element.
