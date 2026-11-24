---
level: advanced
age: 15+
prereqs: [lab-diff-comparator]
teaches: [negative-feedback, phase-delay, oscillation, miller-compensation, stability]
---
## What you see
The differential pair and the op-amp from the comparator bench. The op-amp's output lights a green LED and also goes back to the pair's other input, through three resistors with a capacitor after each one. A slide switch can put one more, smaller capacitor between the op-amp's output and its minus input.

## Try this
1. Click **Sim**. The LED blinks a few times a second.
2. Put a scope probe on the op-amp's output and another on the base the delay line feeds. See how late the second follows the first.
3. Flip the switch. Count how many blinks it takes until the LED calms down.
4. Flip it back. Does the blinking return?

## What is going on
The feedback is meant to hold the circuit still: if the output is too high, the delayed copy of it pushes the pair the other way and brings it down. But each resistor-capacitor step makes the copy arrive later. The comparator reacts at once and with enormous gain, so by the time the correction arrives, the output has already gone all the way, and it swings to the other end. Too late and too strong: that is an oscillator. The small capacitor across the amplifier changes the second part. It makes the output move only slowly, a bit at a time. Now the correction has time to arrive before the output overshoots, and the loop settles at the point where the two bases are equal. Every op-amp chip has such a capacitor built in for the same reason.

## Go further
- [lab-diff-comparator](../lab-diff-comparator) — the same pair and amplifier without feedback.
- [lab-phase-shift](../lab-phase-shift) — a delay line used on purpose to make a sine wave.
