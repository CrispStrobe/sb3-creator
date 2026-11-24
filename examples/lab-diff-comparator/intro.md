---
level: advanced
age: 14+
prereqs: [lab-diff-pair, 17-comparator]
teaches: [differential-pair, comparator, op-amp, fine-tuning, sensitivity]
---
## What you see
The differential pair again: two transistors sharing one emitter resistor, one base on a fixed half-supply divider, the other on a knob. This time the two collectors do not light LEDs themselves. They feed the two inputs of an op-amp, and the op-amp's output switches a green LED (output high) or a red one (output low). A voltmeter shows the difference between the two bases.

## Try this
1. Click **Sim**: green is lit, and the voltmeter shows that the input is only a fraction of a millivolt above the reference.
2. Turn the knob down in tiny steps. Where does the light jump to red? Read the voltmeter right there.
3. Turn the knob from one end to the other. How far does the input voltage move in total?
4. Compare with [lab-diff-pair](../lab-diff-pair): how big a difference did the LEDs there need?

## What is going on
The pair turns the difference between its two bases into a difference between its two collector voltages. On its own that is a gentle slope: about a tenth of a volt moves the current from one side to the other. The op-amp then multiplies the collector difference by a huge factor, so a few hundred microvolts at the bases already drive its output all the way up or down. That makes a very sensitive comparator. To set such a sensitive circuit you need a gentle knob, so the potentiometer sits between two limiting resistors: its full turn spans less than a volt, and every small step moves the input by only a few millivolts. The same trick, coarse range plus fine trimmer, appears in many measuring instruments.

## Go further
- [lab-diff-blinker](../lab-diff-blinker) — feed the output back to the pair, and the comparator starts to blink.
- [lab-diff-pair](../lab-diff-pair) — the bare pair with an LED on each side.
