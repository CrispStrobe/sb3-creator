# lab-first-press-wins — expected behaviour

## Circuit
- Each player's button feeds 5 V through 470 Ω into that player's LED node (A: red, B: green). Both LEDs return to ground.
- The voltage across a lit LED drives a lockout transistor through 10 kΩ: Q1 sits on B's LED node, Q2 on A's. A 1 µF capacitor on each base slows the bases down, so the transistor that is already on wins the race against a late press.
- No supply reaches either side until a button is held: the buttons ARE the flip-flop's collector supplies.

## Observable behaviour

| buttons held | A node | red LED | B node | green LED |
|---|---|---|---|---|
| none | 0 V | off | 0 V | off |
| A only | 1.87 V | ON | 0.02 V | off |
| A first, then B as well | 1.87 V | ON | 0.17 V | off (Q1 shorts it) |
| B first, then A as well | 0.17 V | off (Q2 shorts it) | 1.87 V | ON |

- With A held alone, the red LED carries (5 − 1.8655) / 470 = 6.67 mA minus the small current that flows on through R3 into Q1's base, which leaves about 6.55 mA.
- Releasing both buttons resets the duel; the base capacitors discharge within a fraction of a second.
- Pressing both in the same simulation step gives a result decided by whatever charge is left on the base capacitors. A simulator is deterministic, so it cannot show real metastability; on a real bench the tiny mismatch between the two halves decides.

```assert
# nobody pressing: both LED nodes and both bases at 0 V
net r_a.b V 0.00 +-0.01
net r_b.b V 0.00 +-0.01
net q_a.base V 0.00 +-0.01
net btn_a.a V 5.00 +-0.01
```
