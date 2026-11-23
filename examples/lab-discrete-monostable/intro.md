---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc06-rc-charge]
teaches: [monostable, one-shot, schmitt-trigger, rc-time-constant]
---
## What you see
Two transistors, a red and a green LED, a big capacitor and a button. Red is the resting state. Press the button and it turns green for a few seconds, like a pedestrian light.

## Try this
1. Click **Sim**. At first it shows green for a few seconds while the capacitor fills, then red.
2. Press the button briefly. Green, and after about four seconds red again.
3. Hold the button for a while. It stays green, and the four seconds only start when you let go.

## What is going on
The button empties the capacitor. As long as the capacitor voltage is low, the first transistor gets no base current and is off, which lets the second one conduct: green. After you let go the capacitor charges slowly through 100 kΩ. When it passes about 3 V the first transistor switches on and the second one off: red. The two transistors share one emitter resistor, which makes the change-over snap instead of fade. Bigger capacitor or bigger resistor: longer green.

## Go further
- [lab-two-led-monostable](../lab-two-led-monostable) — the same job with an op-amp comparator.
- [pc47-555-monostable](../pc47-555-monostable) — and with a 555 timer.
