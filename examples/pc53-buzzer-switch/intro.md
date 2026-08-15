---
level: beginner
age: 8+
prereqs: []
teaches: [buzzer, switch, simple-circuit]
---
## What you see
A buzzer connected to a battery through a switch. Press the switch and the buzzer sounds; release it and the buzzer stops. The simplest possible interactive circuit.

## Try this
1. Click the switch and listen to the buzzer sound.
2. Release the switch and confirm the buzzer stops immediately.
3. Try adding a second buzzer in parallel and listen to both sound together.

## What is going on
The switch breaks the circuit path from the battery's positive terminal through the buzzer to ground. When the switch is open, no current flows and the buzzer is silent. When you close it, current flows through the buzzer's internal oscillator, which vibrates a diaphragm to produce sound. There is no microcontroller or programming involved — this is pure hardware doing one thing reliably.

## Why it matters
This is the foundation of all interactive electronics: a human action (pressing a button) controls a physical output (sound). Every doorbell, alarm, and notification system starts from this principle. Understanding it builds intuition for how switches control current flow.

## Go further
- [pc60-night-lamp-hardware](../pc60-night-lamp-hardware) — a circuit that switches automatically instead of manually.
- [pc62-motor-indicator](../pc62-motor-indicator) — a switch controlling a motor with a status LED.
- Experiment: add a resistor in series with the buzzer and listen to whether the volume changes — some buzzers are voltage-driven and will not care, while others will get quieter.
