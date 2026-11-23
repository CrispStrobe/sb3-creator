# lab-rtl-gates — expected behaviour

## Circuit
Resistor-transistor logic on 5 V. Buttons A and B pull their input lines to +5 V; 10 kΩ resistors pull them to ground when released. Every transistor gets its base through 10 kΩ and its collector load is 1 kΩ to +5 V. The output LED sits from the collector to ground, so it lights when the output is HIGH (positive logic).

- NOT: one NPN driven by A.
- NOR: two NPNs side by side (collectors joined), driven by A and B.
- OR: a third inverter driven by the NOR output.
- NAND: two NPNs stacked collector-to-emitter, driven by A (top) and B (bottom).

## Observable behaviour

| A | B | NOT A (red) | A NOR B (yellow) | A OR B (green) | A NAND B (blue) |
|---|---|---|---|---|---|
| 0 | 0 | ON | ON | off | ON |
| 1 | 0 | off | off | ON | ON |
| 0 | 1 | ON | off | ON | ON |
| 1 | 1 | off | off | ON | off |

- **HIGH is not 5 V.** An output that is HIGH sits at about 1.75 V: the LED clamps it, and about 3.25 mA flows through the 1 kΩ load into the LED.
- **LOW is not 0 V either.** A single saturated transistor pulls its output to about 0.07 V. The NAND, with two transistors in series, only gets down to about 0.14 V.
- **Inputs take current.** Pressing A sends about 0.43 mA into the NOT transistor's base, and the same again into the NOR and NAND bases. Every gate an input drives is another load on it: that is fan-out.

## What this verifies
1. One transistor with a collector load inverts.
2. Parallel transistors pull down if either input is high (NOR); stacked transistors pull down only if both are (NAND).
3. Putting an inverter after NOR gives OR: gates compose.

```assert
# both buttons released
net led_not.anode V 1.75 +-0.05
net led_nor.anode V 1.75 +-0.05
net led_or.anode V 0.11 +-0.05
net led_nand.anode V 1.75 +-0.05
```
