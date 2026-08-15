---
level: intermediate
age: 12+
prereqs: [pc40-opamp-threshold]
teaches: [voltage-follower, buffer, impedance-matching]
---
## What you see
An op-amp with its output connected directly back to its inverting input. The output voltage follows the input exactly — unity gain, no amplification, but the output can drive loads the source cannot.

## Try this
1. Set the input to 2.5 V and confirm the output reads 2.5 V.
2. Connect a load resistor to the output and verify the voltage stays at 2.5 V even with the load drawing current.
3. Connect the same load directly to the input source (bypassing the op-amp) and observe the voltage drop.

## What is going on
The op-amp drives its output to make the voltage difference between its two inputs zero. With 100% feedback (output wired to the inverting input), the output must equal the non-inverting input. The gain is exactly 1. The key benefit is impedance transformation: the input draws almost no current from the source, while the output can supply milliamps to a load. The op-amp acts as a buffer, isolating the source from the load.

## Why it matters
Many sensors and reference circuits produce the right voltage but cannot supply much current. A voltage follower lets you use that voltage to drive LEDs, ADC inputs, or other circuits without disturbing the source. It is one of the most common op-amp configurations in practice.

## Go further
- [pc40-opamp-threshold](../pc40-opamp-threshold) — an op-amp used as a comparator instead of a buffer.
- [pc55-ntc-indicator](../pc55-ntc-indicator) — a sensor output that could benefit from buffering.
- Experiment: add a second op-amp follower in the chain and confirm the output is still the same voltage — buffers in series do not change the signal.
