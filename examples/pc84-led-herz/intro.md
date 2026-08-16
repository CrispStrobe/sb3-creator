---
level: advanced
age: 14+
prereqs: [pc40-opamp-threshold]
teaches: [LM358, integrator, comparator, triangle-wave, breathing-LED]
---
## What you see
A breathing LED heart: five red LEDs pulse gently up and down. No microcontroller, no software — an LM358 dual op-amp generates a triangle wave that smoothly dims the LEDs.

## Try this
1. Click **Sim** — the LEDs pulse evenly up and down.
2. The pulse rate depends on R and C of the integrator: larger C → slower breathing.
3. All five LEDs are in parallel on the triangle output — they breathe in sync.

## What is going on
Op-amp 1 of the LM358 acts as an integrator: it turns the square wave from op-amp 2 into a triangle. Op-amp 2 acts as a comparator with hysteresis: it flips when the triangle reaches the upper or lower threshold, feeding back a new square wave. The triangle drives the LEDs — brightness follows the waveform.

## Go further
- [pc85-led-lampe-puls](../pc85-led-lampe-puls) — same circuit, one LED instead of five.
- [pc40-opamp-threshold](../pc40-opamp-threshold) — the comparator building block in isolation.
