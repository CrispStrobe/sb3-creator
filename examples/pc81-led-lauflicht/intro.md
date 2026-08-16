---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, CD4017, decade-counter, LED-chaser, sequential-logic]
---
## What you see
An LED chaser: ten LEDs light one at a time in sequence, driven by a 555 timer clocking a CD4017 decade counter. Only one LED is on at any moment — the rest are dark.

## Try this
1. Click **Sim** — the LEDs chase around the circle, one at a time.
2. Speed is set by the 555: R₁=1 kΩ, R₂=47 kΩ, C=10 µF → f ≈ 1.5 Hz.
3. Each clock pulse advances the counter one output: q0 → q1 → ... → q9 → q0.

## What is going on
The 555 generates a square wave that drives the CD4017's clock input. The CD4017 is a decade counter: on each clock pulse exactly one output (q0–q9) goes HIGH, all others stay LOW. After q9 the counter wraps back to q0.

## Go further
- [pc82-mini-roulette](../pc82-mini-roulette) — same principle but with a slowdown effect.
- [51-555-astable](../51-555-astable) — the clock generator alone.
