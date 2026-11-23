---
level: advanced
age: 14+
prereqs: [lab-scr-pair, pc06-rc-charge]
teaches: [relaxation-oscillator, unijunction, threshold, sawtooth]
---
## What you see
A capacitor, a rheostat, a PNP and an NPN transistor and a red LED. The LED gives short, bright flashes at a steady rhythm.

## Try this
1. Click **Sim** and count the flashes: about three every two seconds.
2. Turn the rheostat down. The flashes come much faster. Turn it up: slower.
3. Put a scope probe on the capacitor and watch the sawtooth: slow climb, sudden drop.
4. Turn the battery voltage down to 5 V. The flashing stops: a low-battery warning.

## What is going on
The capacitor charges through the resistors. The PNP transistor watches it: as long as the capacitor is below the voltage on its base, nothing flows. When the capacitor gets a little above it, the PNP starts to conduct, which switches on the NPN, which pulls the PNP's base down and turns it on even harder. Within a moment both are fully on and the capacitor empties through the LED. When almost nothing is left the pair switches off and the charging starts over. This pair of transistors behaves like a single special part, the programmable unijunction transistor, once used in metronomes and flashers.

## Go further
- [lab-scr-pair](../lab-scr-pair) — the same pair fired by a button: a thyristor.
- [lab-astable-blinker](../lab-astable-blinker) — another way to make a blinker with two transistors.
