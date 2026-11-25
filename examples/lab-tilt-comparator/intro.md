---
level: intermediate
age: 12+
prereqs: [lab-diff-pair]
teaches: [op-amp, comparator, open-loop-gain]
---
## What you see
An op-amp with nothing between its output and its inputs. One input sits at half the supply; the other comes from a knob that can only move it a few hundredths of a volt either way. A red and a green LED show which way the output went.

## Try this
1. Click **Sim**. The knob is tilted a little to the left: red is lit.
2. Turn the knob slowly towards the middle. A little before it (near 0.45) the light jumps to green: the op-amp's own tiny input currents shift the balance point.
3. Try to stop exactly where both LEDs glow. You need a very steady hand: the whole change happens within a thousandth of the knob's turn.
4. Hover over the knob's wiper and the − input to see how few millivolts apart they are.

## What is going on
An op-amp multiplies the difference between its two inputs by an enormous number, about a hundred thousand here. With no feedback to tame it, a difference of a tenth of a millivolt is already enough to swing the output all the way up or down. So the op-amp behaves like a seesaw that tips completely at the slightest imbalance: it compares two voltages and tells you which is higher. That is why the knob here only covers a few millivolts; with a full-range knob the tipping point would be impossible to find.

## Go further
- [lab-diff-pair](../lab-diff-pair) — the transistor pair that sits at the input of every op-amp.
- [lab-ramp-timer](../lab-ramp-timer) — three op-amps used as comparators on a ramp.
