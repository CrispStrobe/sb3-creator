# lab-dual-gate — expected behaviour

## Circuit
9 V. A depletion-mode dual-gate MOSFET with a green LED and 470 Ω in its drain; its source sits on a red
reference LED (2.2 kΩ from +9 V keeps it lit, so the source is about 1.8 V above ground). Each gate has
its own slide switch: on the left it connects the gate to +9 V, on the right to ground, which is below
the source.

## Observable behaviour
- Both switches left (both gates high, as loaded): the channel conducts and the green LED lights,
  about 10 mA.
- Either switch to the right: that gate is about 1.8 V below the source, beyond pinch-off (−1.2 V),
  and the green LED goes dark. It does not matter which gate it is: both sit over the same channel.
- Both to the right: dark as well. The LED is lit only while gate 1 AND gate 2 are high.
- The red reference LED stays lit throughout (it carries the bleed current, and the channel current
  when the green LED is on).

## What this verifies
1. One channel, two gates in series: either gate alone can pinch it off.
2. Depletion mode: a gate a little below its source is enough to switch the channel off.

```assert
# both gates high
net dual_gate_mosfet_5.source V 1.82 +-0.05
net led_4.anode V 4.14 +-0.15
```
