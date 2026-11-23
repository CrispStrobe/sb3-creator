---
level: intermediate
age: 12+
prereqs: [42-diode-rectifier, pc29-capacitor-discharge]
teaches: [peak-detector, envelope-follower, attack-release, time-constant]
---
## What you see
A sound source (it stands in for an amplified microphone), a **clap** button that lets the sound through, two diodes, a large hold capacitor and a transistor with a green LED.

## Try this
1. Click **Sim**: quiet, the LED is dark.
2. Tap **clap** once: the LED flashes up and fades over about a second.
3. Now tap it several times quickly, like applause. The LED stays on and gets brighter.
4. Stop and watch it fade.
5. Make the 220 kΩ release resistor larger: the meter now "remembers" longer.

## What is going on
The sound is an alternating voltage. The diodes only let charge flow one way, into the hold capacitor, and only when the sound is loud enough. That happens quickly through the small 1 kΩ resistor (fast attack). Draining it again is only possible through large resistors (slow release). So one clap gives a short flash, but claps that come faster than the capacitor can empty keep it charged and the LED lit. Level meters on mixing desks work the same way.

## Go further
- [lab-am-detector](../lab-am-detector) — the same diode-and-capacitor idea recovering sound from a radio wave.
- [pc88-lichtorgel](../pc88-lichtorgel) — an LED that follows the sound directly, without holding.
