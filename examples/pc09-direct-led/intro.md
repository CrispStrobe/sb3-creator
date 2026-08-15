---
level: beginner
age: 8+
prereqs: []
teaches: [led, resistor, direct-wiring]
---
## What you see
A red LED and a 1 kΩ resistor wired directly to a 9 V battery — no breadboard. The same circuit as pc01, but with point-to-point connections you can trace from part to part.

## Try this
1. Click **Sim** and watch the LED light up.
2. Follow the wire path: battery positive → resistor → LED → battery negative. Every electron takes the same route.
3. Change the resistor to 220 Ω and see how much brighter the LED gets.

## What is going on
This is the simplest possible LED circuit. The 1 kΩ resistor limits the current to about 7 mA — safe for the LED, though dimmer than with a lower resistor. The LED drops about 2 V, and the remaining 7 V falls across the resistor: I = 7 V / 1 kΩ = 7 mA.

## Why it matters
Direct wiring is how real prototypes start before a breadboard appears. Being able to read a schematic as a chain of connections — not as a layout — is the first skill of electronics.

## Go further
- [pc01-led-resistor](../pc01-led-resistor) — the same circuit on a breadboard.
- [pc10-direct-series](../pc10-direct-series) — add a second LED in series.
- Experiment: what is the largest resistor that still makes the LED visibly glow?
