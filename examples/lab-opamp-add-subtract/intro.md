---
level: intermediate
age: 12+
prereqs: [lab-opamp-gain]
teaches: [summing-amplifier, difference-amplifier, forward-voltage, analog-computing]
---
## What you see
A LED and a diode, each with a resistor, and an op-amp with two halves: one adds their voltages, the other subtracts them. Two meters show the answers.

## What to do
1. Click **Sim**. Read both meters: about 2.17 V and about 1.01 V.
2. Measure the LED and the diode yourself and check the arithmetic.
3. Slide the switch to the right to use the green LED instead. Both answers grow by the same amount.

## What is going on
In the adder both voltages meet at the + input through equal resistors, so that input sits halfway between them. An amplifier with a gain of 2 then gives back their sum. In the subtractor the + input gets half of the LED voltage, and the - input is wired so that the output must be the LED voltage minus the diode voltage. Op-amps used like this are the building blocks of analogue computers.

## Go further
- [lab-2bit-dac](../lab-2bit-dac) — adding weighted voltages to make a converter.
- [lab-opamp-gain](../lab-opamp-gain) — the gain stage on its own.
