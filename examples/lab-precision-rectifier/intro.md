---
level: advanced
age: 14+
prereqs: [pc08-diode-polarity, lab-opamp-gain]
teaches: [precision-rectifier, diode-threshold, negative-feedback, op-amp, AC-measurement]
---
## What you see
Two rectifiers fed from the same knob. One is a plain diode with a load resistor. The other is the same diode placed inside an op-amp's feedback loop. The knob only moves about one volt either way, which is the kind of small signal a sound-level meter has to measure.

## Try this
1. At the start (input +0.51 V) the plain diode passes nothing at all, while the precision rectifier passes all 0.51 V.
2. Turn INPUT slowly to the top. The plain diode only wakes up near 0.7 V and always stays about 0.7 V short.
3. Turn INPUT below the middle. Both outputs block the negative half. Look at what the op-amp output does then.
4. Watch the op-amp's own output on the positive side: it is always one diode drop above the input.

## What is going on
A silicon diode conducts only once its forward voltage of roughly 0.7 V is reached. For mains rectification that loss hardly matters; for a 0.5 V audio signal it swallows everything. In the precision rectifier the op-amp compares its input with the output after the diode and raises its own output until the two match. The diode's 0.7 V is still there, but the op-amp quietly supplies it. That is the general trick of negative feedback: whatever imperfection sits inside the loop, the loop corrects it. AC voltmeters and VU meters use this to measure small signals honestly.

## Go further
- [lab-opamp-gain](../lab-opamp-gain): feedback setting the gain.
- [pc49-diode-clamp](../pc49-diode-clamp): what a plain diode does with a signal.
