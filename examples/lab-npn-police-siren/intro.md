---
level: intermediate
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, frequency, parallel-resistors, filter, sound]
---
## What you see
A transistor tone generator that runs all the time, a **SIREN** button, a slide switch next to two resistors, and a **SOFT** switch with a capacitor.

## Try this
1. Click **Sim**: a steady note in the earphone.
2. Press and release **SIREN** again and again: the note jumps up and back down, like a siren.
3. Move the slide switch to the other resistor and do it again: the upper note is shriller.
4. Close **SOFT**: the same notes, but rounder and softer.

## What is going on
The base of the first transistor is fed through 100 kΩ. **SIREN** puts a second resistor in parallel; two resistors side by side pass more current than one, so the timing capacitor recharges faster and the pitch goes up. The smaller the extra resistor (15 kΩ rather than 47 kΩ), the bigger the jump. The earphone hangs from the emitter of a third transistor, which hands on whatever voltage reaches its base. **SOFT** adds a capacitor there: it has to charge through 10 kΩ, so the sharp steps become ramps, and a tone with rounded edges sounds gentler.

## Go further
- [lab-npn-swell-siren](../lab-npn-swell-siren) — a siren that glides instead of jumping.
