---
level: beginner
age: 10+
prereqs: [pc02-voltage-divider, pc01-led-resistor]
teaches: [potentiometer, variable-resistance, dimming]
---
## What you see
A potentiometer (variable resistor) controls how bright an LED glows. Turning the knob changes the voltage at the wiper, which changes the current through the LED.

## Try this
1. Click **Sim** and note the LED brightness.
2. Adjust the potentiometer position and watch the LED brighten or dim.
3. Set the pot to 0% — the wiper is at ground, no current flows, and the LED goes dark.

## What is going on
A potentiometer is a resistor with a sliding contact (the wiper). One end connects to the supply, the other to ground, and the wiper taps off a voltage anywhere in between — it is a continuously adjustable voltage divider. The wiper voltage feeds through a 220 Ω resistor to the LED. Higher wiper voltage means more current and a brighter LED. At 50%, the wiper is at about 2.5 V, giving roughly (2.5 − 2.0) / 220 ≈ 2.3 mA — a dim glow. At 100%, it is the same as connecting directly through 220 Ω.

## Why it matters
Potentiometers are the simplest way to give a user analogue control over a circuit — volume knobs, dimmer switches, and joysticks all use them. Understanding the voltage divider inside a pot is the key to using them correctly.

## Go further
- [pc02-voltage-divider](../pc02-voltage-divider) — the fixed version of the same principle.
- [pc48-ldr-comparator](../pc48-ldr-comparator) — a light-dependent resistor in a divider, acting as an automatic sensor.
- Experiment: replace the 220 Ω resistor with 1 kΩ and notice how the dimming range changes.
