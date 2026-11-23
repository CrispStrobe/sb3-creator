---
level: advanced
age: 14+
prereqs: [pc54-opamp-follower, pc40-opamp-threshold]
teaches: [op-amp, negative-feedback, inverting-amplifier, non-inverting-amplifier, virtual-ground]
---
## What you see
One op-amp chip, two amplifiers. Both listen to the same INPUT knob, which only moves half a volt either side of ground. The left one turns the signal upside down and makes it 4.7 times bigger; the right one keeps the sign and makes it 5.7 times bigger. Two 9 V sources give the chip a plus and a minus supply.

## Try this
1. Turn INPUT and read the three voltmeters. Divide each output by the input: the numbers stay the same at every position.
2. Measure the inverting input of the left amplifier. It is not connected to ground, but it reads 0 V.
3. Work out the gains from the resistors (470k/100k and 1 + 47k/10k) before you check them on the meters.

## What is going on
An op-amp on its own amplifies the difference between its inputs hundreds of thousands of times, far too much to be useful. Feeding part of the output back to the inverting input makes it correct itself: it drives its output until the two inputs are equal. In the inverting amplifier that means the input current through R_in has to flow on through R_f, so the output must be −R_f/R_in times the input. In the non-inverting amplifier the divider R_f/R_g must hand back exactly the input voltage, so the output is (1 + R_f/R_g) times the input. The gain now depends only on resistors you choose.

## Go further
- [pc54-opamp-follower](../pc54-opamp-follower): gain 1, the simplest feedback.
- [lab-opamp-integrator](../lab-opamp-integrator): a capacitor instead of R_f.
