---
level: beginner
age: 8+
prereqs: []
teaches: [battery, portable-circuit, voltage-matching]
---
## What you see
The simplest portable circuit: a battery (coin cell or AA), a resistor, and an LED. No breadboard, no MCU — just three components that fit in the palm of your hand. The LED glows as long as the battery has charge.

## Try this
1. Run the simulation and confirm the LED lights up from the battery alone.
2. Change the battery voltage (e.g. 3 V coin cell vs. 1.5 V AA) and observe whether the LED still lights — a 1.5 V battery may be too low for some LEDs.
3. Remove the resistor and note the current spike — even with a small battery, the LED needs protection.

## What is going on
A battery provides a fixed voltage that decreases as it discharges. The resistor limits the current to a safe level for the LED, just as in a mains-powered circuit. The key difference is that a battery has limited energy — a CR2032 coin cell holds about 220 mAh, so at 20 mA an LED drains it in roughly 11 hours. Matching the battery voltage to the LED's forward voltage is important: a single 1.5 V AA cell cannot forward-bias most LEDs (which need about 2 V), but a 3 V coin cell can.

## Why it matters
Battery-powered circuits are the starting point for portable projects — wearables, sensors, toys. Understanding voltage matching and current budgeting determines whether your project runs for hours or minutes.

## Go further
- [21-resistor-led](../21-resistor-led) — the same circuit with a bench supply instead of a battery.
- [01-blink](../01-blink) — add a microcontroller to blink the LED and save battery by turning it off half the time.
- Experiment: calculate how long a CR2032 (220 mAh, 3 V) can power an LED at 10 mA, and how much longer at 5 mA with a larger resistor.
