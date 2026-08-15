---
level: beginner
age: 12+
prereqs: [pc08-diode-polarity]
teaches: [diode-logic, or-gate, signal-combining]
---
## What you see
Two input signals each pass through a diode into a shared output. If either input is high, the output is high. Both must be low for the output to be low — this is an OR gate built from diodes.

## Try this
1. Set both inputs low and confirm the output is low.
2. Set one input high (either one) and watch the output go high.
3. Set both inputs high and confirm the output is still high — OR does not care which input is active, only that at least one is.

## What is going on
Each diode conducts when its anode (input side) is higher than the cathode (output side) by about 0.7 V. When an input goes high, its diode conducts and pulls the output high. The other diode is reverse-biased and blocks, so the inputs do not interfere with each other. A pull-down resistor holds the output low when neither input is active. The output voltage is about 0.7 V less than the input because of the diode drop.

## Why it matters
Diode logic was how the earliest computers implemented gates before transistors were cheap. Today it still appears in power-path switching (choosing the higher of two supply voltages) and signal-combining circuits. Understanding it shows that logic is not magic — it is just careful use of one-way current flow.

## Go further
- [pc08-diode-polarity](../pc08-diode-polarity) — the one-way conduction that makes this work.
- [pc49-diode-clamp](../pc49-diode-clamp) — diodes used for voltage limiting instead of logic.
- Experiment: add a third input diode and confirm the gate still works — diode OR scales to any number of inputs.
