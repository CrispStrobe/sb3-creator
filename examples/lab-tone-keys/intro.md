---
level: beginner
age: 10+
prereqs: [pc67-555-tongenerator, pc03-series-resistors]
teaches: [series-resistors, parallel-resistors, 555-timer, pitch, frequency]
---
## What you see
A 555 tone generator with only two keys, yet it plays four notes. Each key does not choose a note directly: it changes how the timing resistors are connected.

## Try this
1. Start the simulation and listen (or look at the scope): the lowest note plays with no key pressed.
2. Before pressing anything, work out R2 for each case: KEY 2 shorts R_a, KEY 1 puts R_c in parallel with the chain, both does both.
3. Press KEY 2, then KEY 1, then both. Check that the notes rise in the order your resistances fall.
4. Play a four-note tune.

## What is going on
The 555 charges its capacitor through R1 + R2 and discharges it through R2, between one third and two thirds of the supply. A bigger R2 means slower charging and a lower pitch: f = 1.44 / ((R1 + 2·R2) · C). Shorting a resistor removes it from a series chain; adding a resistor in parallel always lowers the total. So two buttons give four different totals: 80 kΩ, 47 kΩ, 29.6 kΩ and 23.5 kΩ, from lowest note to highest.

## Go further
- [pc67-555-tongenerator](../pc67-555-tongenerator): the same chip with one fixed pitch.
- [lab-pitch-probe](../lab-pitch-probe): let any material be the timing resistor.
