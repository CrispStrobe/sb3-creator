---
level: advanced
age: 14+
prereqs: [pc54-opamp-follower]
teaches: [dac, binary-weighting, summing-amplifier]
---
## What you see
Two switches stand for a two-bit binary number. An op-amp turns that number into a voltage you can read on a meter: 0, 0.5, 1.0 or 1.5 V.

## Try this
1. Click **Sim**. The switches say 1 and 0 — the meter shows 1.0 V.
2. Try all four combinations and write down the voltage for each.
3. Which switch is "worth" more? By how much?

## What is going on
Each switch sends a current from the 1.5 V reference into the op-amp's input. Bit 1 goes through 15 kΩ, bit 0 through 30 kΩ, so bit 1 delivers twice the current. The op-amp adds the currents and turns their sum into a voltage across its 10 kΩ feedback resistor (upside down, so a second op-amp turns it the right way up). Twice the resistor, half the weight — that is how binary numbers become voltages in every DAC.

## Go further
- [lab-2bit-adc](../lab-2bit-adc) — the way back: from voltage to bits.
