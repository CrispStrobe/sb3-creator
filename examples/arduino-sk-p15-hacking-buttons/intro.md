---
level: intermediate
age: 12+
prereqs: [arduino-01-blink]
teaches: [optocoupler, remote-trigger, digital-output]
---
## What you see
An optocoupler on D2 triggers at 1 Hz — a half-second on, half-second off pulse. The optocoupler can replace a physical button press on another device.

## Try this
1. Run the program and watch the optocoupler output toggle.
2. Change the timing to a faster pulse (0.1 on, 0.1 off) for rapid triggering.
3. Change it to a single pulse (turn on, wait, turn off, then stop) for a one-shot trigger.

## What is going on
The optocoupler is an LED inside a package that shines on a phototransistor. When the Arduino drives the LED side HIGH, the transistor side conducts — electrically isolated. This lets you press a button on one circuit from another circuit without any electrical connection between them. The Starter Kit project uses this to hack a remote control or toy.

## Go further
- [arduino-sk-p09-motorized-pinwheel](../arduino-sk-p09-motorized-pinwheel) — drive a motor instead of an optocoupler.
- [09-relay-clicker](../09-relay-clicker) — use a relay for higher-power isolated switching.
