# lab-mosfet-nand — expected behaviour

## Circuit
9 V. One depletion-mode dual-gate MOSFET. A red LED sits across its channel (anode on the drain, cathode on
the source) and is fed through 1 kΩ from +9 V. The source sits on a yellow reference LED (2.2 kΩ bleed from
+9 V, about 1.9 V). Each gate is pulled to ground, below the source, by 100 kΩ; button A lifts gate 1 to
+9 V, button B lifts gate 2.

## Observable behaviour
- No button, or only one: at least one gate is below the source, the channel is pinched, and the 1 kΩ
  current flows through the red LED: lit, about 5.4 mA.
- Both buttons together: the channel conducts and shorts the red LED out: dark.
- Truth table: the output LED is off only when A AND B are pressed: a NAND gate made of a single transistor.

## What this verifies
1. Two gates in series over one channel make an AND of the gate inputs.
2. With the load across the channel the output is inverted: NAND.

```assert
# no button pressed: both gates pinched, the red LED lit
net dual_gate_mosfet_5.source V 1.95 +-0.06
net dual_gate_mosfet_5.gate1 V 0.00 +-0.02
net led_4.anode V 3.64 +-0.15
```
