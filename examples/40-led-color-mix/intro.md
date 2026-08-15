---
level: beginner
age: 8+
prereqs: []
teaches: [rgb-led, color-mixing, parallel-branches]
---
## What you see
An RGB LED with three separate channels — red, green, and blue — each with its own current-limiting resistor. By turning channels on or off in combination, you can mix colours: red plus green makes yellow, red plus blue makes magenta, all three make white.

## Try this
1. Run the simulation with all three channels on and observe the resulting white light.
2. Turn off the blue channel — the LED should appear yellow (red + green).
3. Try each channel individually, then in pairs, to see all six primary and secondary colours.

## What is going on
An RGB LED contains three tiny LEDs in one package, sharing a common pin. Each colour channel is an independent circuit with its own resistor, so the currents do not interfere. The human eye blends the three colours additively — this is the same principle used by phone screens and monitors. Different resistor values on each channel adjust the brightness ratios and therefore the perceived colour.

## Why it matters
Colour mixing with RGB LEDs is how indicator lights, LED strips, and displays produce millions of colours from just three primaries. Understanding parallel branches and independent current paths is essential for any multi-channel circuit.

## Go further
- [24-pwm-fade](../24-pwm-fade) — use PWM to vary brightness continuously instead of just on/off, unlocking the full colour spectrum.
- [45-led-current-comparison](../45-led-current-comparison) — see how different resistor values affect LED brightness.
- Experiment: predict what colour you get from red at full brightness, green at half (higher resistor), and blue off, then verify.
