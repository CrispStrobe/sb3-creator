---
level: beginner
age: 12+
prereqs: [pc05-npn-switch]
teaches: [automatic-control, ldr-trigger, hardware-only]
---
## What you see
A lamp that turns on automatically when it gets dark, using only an LDR, a transistor, and a few resistors — no microcontroller. The LDR senses ambient light, the transistor switches the lamp, and the circuit runs itself.

## Try this
1. Run the simulation in "daylight" and confirm the lamp stays off.
2. Reduce the light level (cover the LDR) and watch the lamp turn on by itself.
3. Increase the light again and see the lamp switch back off.

## What is going on
The LDR (Light Dependent Resistor) has high resistance in darkness and low resistance in light. It forms a voltage divider with a fixed resistor. In darkness the LDR resistance rises, the voltage at the transistor base crosses the threshold, and the transistor turns on, powering the lamp. In light the LDR resistance is low, the base voltage drops below the threshold, and the transistor turns off. The circuit is an automatic switch with no code, no clock, no programming — just physics and a threshold.

## Why it matters
Automatic night lights are everywhere — garden lamps, street lights, emergency path lighting. This circuit shows that useful automation does not require software. A sensor, a threshold, and a switch are enough for many real-world control problems, and understanding this analog approach makes digital solutions less of a black box.

## Go further
- [pc05-npn-switch](../pc05-npn-switch) — the transistor switching principle used here.
- [pc55-ntc-indicator](../pc55-ntc-indicator) — a similar circuit using temperature instead of light.
- Experiment: add a potentiometer to the voltage divider to make the light threshold adjustable — this is how commercial dusk sensors let you set the sensitivity.
