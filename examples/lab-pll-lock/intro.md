# A phase-locked loop locks onto a transistor oscillator

A phase-locked loop (PLL) makes its own oscillator run in step with another one. Here the other one is a two-transistor oscillator you tune with a potentiometer; the PLL follows it, and two LEDs show whether it has caught it.

**Teaches:** phase-locked loops, control vs. regulation, lock range

## What to do

Click **Sim**. Hover over the PLL chip to see its frequency. Turn the tune potentiometer slowly and watch the LEDs. Then move the slide switch to manual and turn the manual potentiometer.

## What you should see

- Loop closed: the PLL's frequency equals the oscillator's (about 740 Hz as built), and the green LED is lit.
- Tune the oscillator too low (below 532 Hz): the PLL cannot follow and the red LED lights.
- Manual: the PLL's frequency depends only on the manual pot.

## Why it works

The phase comparator watches the rising edges of both signals. When the input edge comes first it pushes the control voltage up, when the PLL's own edge comes first it pulls it down, and when they arrive together it does nothing. So the loop always ends with both oscillators in step: it regulates instead of just setting. If the input is outside the range the PLL's oscillator can reach, the comparator keeps pushing in vain, its "in step" output stays low, and the red LED lights. Radios and phones lock their tuning oscillators this way.
