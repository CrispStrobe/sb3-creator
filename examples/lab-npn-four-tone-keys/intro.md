---
level: beginner
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, frequency, series-parallel, sound]
---
## What you see
A transistor tone generator that sounds all the time, and two buttons, **A** and **B**, beside a chain of three resistors.

## Try this
1. Click **Sim**: a steady low drone in the earphone.
2. Hold **B**: one step higher.
3. Hold **A** instead: higher again.
4. Hold **A** and **B** together: the highest of the four notes.
5. Play a tune by combining the two buttons, like the chanter of a bagpipe over its drone.

## What is going on
The first transistor's base is fed through 27 kΩ + 39 kΩ + 22 kΩ in series. Button A bridges the 39 kΩ, button B the 22 kΩ, so the chain can be 88, 66, 49 or 27 kΩ. Less resistance recharges the timing capacitor faster and raises the pitch. Two buttons, four combinations, four notes.

## Go further
- [lab-npn-two-tone-bell](../lab-npn-two-tone-bell) — one resistor per button.
- [lab-tone-keys](../lab-tone-keys) — the same idea on a timer chip.
