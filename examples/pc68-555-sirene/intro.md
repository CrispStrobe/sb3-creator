---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator]
teaches: [555-timer, astable, siren, pitch-control]
---
## What you see
A 555 siren circuit: a potentiometer controls the pitch from a low hum to a high whine. R₁ = 1 kΩ, pot up to 47 kΩ, C = 100 nF.

## Try this
1. Click **Sim** — the buzzer produces a tone.
2. Turn the pot — the pitch changes smoothly.
3. Pot fully clockwise → high pitch. Counter-clockwise → low pitch.

## What is going on
The potentiometer replaces the fixed R₂ of the tone generator. The frequency f = 1.44 / ((R₁ + 2·R_pot) × C) changes with the pot position. This gives a continuously variable siren.

## Go further
- [pc67-555-tongenerator](../pc67-555-tongenerator) — fixed frequency without the pot.
- [pc65-555-metronom](../pc65-555-metronom) — low frequency as a metronome.
