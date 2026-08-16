---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, astable, audio, frequency]
---
## What you see
A 555 timer as a tone generator. R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF produce f = 1.44 / ((1k + 2·10k) × 100n) ≈ 686 Hz — a clearly audible tone.

## Try this
1. Click **Sim** — the buzzer produces a steady tone (~686 Hz).
2. The frequency is fixed — it depends only on R₁, R₂ and C.

## What is going on
In astable mode the 555 oscillates between charging (through R₁ + R₂) and discharging (through R₂ only). With a small C and moderate resistors the frequency lands in the audible range. The duty cycle is asymmetric: t_high = 0.693 × (R₁+R₂) × C, t_low = 0.693 × R₂ × C.

## Go further
- [pc68-555-sirene](../pc68-555-sirene) — same circuit with a pot for variable pitch.
- [51-555-astable](../51-555-astable) — low frequency so you see it blink instead of hearing it.
