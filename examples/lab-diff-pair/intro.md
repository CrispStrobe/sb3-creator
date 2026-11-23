---
level: advanced
age: 14+
prereqs: [38-npn-switch, 17-comparator]
teaches: [differential-pair, long-tailed-pair, common-mode, op-amp-input-stage]
---
## What you see
Two transistors whose emitters share one resistor, a red LED on the left and a green one on the right. The left base is held at half the supply, the right base comes from a knob.

## Try this
1. Click **Sim**: with the knob in the middle both LEDs glow at half brightness.
2. Turn the knob slowly up. Within a few tenths of a volt the light moves completely to the green side.
3. Turn it down past the middle: now red takes everything.
4. Watch the voltage on the shared emitter resistor: it follows whichever base is higher.

## What is going on
The shared resistor fixes the total current, about 3.7 mA. The two transistors only decide how to split it, and the one with the higher base takes more — exponentially more, so a difference of 0.1 V already moves almost all of it. If both inputs rise together nothing changes, because the split depends only on their difference. That is why every op-amp starts with exactly this pair.

## Go further
- [17-comparator](../17-comparator) — a ready-made comparator chip.
- [lab-schmitt-clap](../lab-schmitt-clap) — the same shared emitter resistor, with feedback added.
