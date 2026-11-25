---
level: intermediate
age: 12+
prereqs: [lab-charge-pump, lab-nand-pips]
teaches: [charge-pump, voltage-doubler, schmitt-oscillator, diode]
---
## What you see
A logic chip on 5 V, two capacitors, two diodes, a red LED and a voltmeter that ends up showing almost twice the supply voltage.

## What to do
1. Click **Sim** and watch the voltmeter climb from about 3.8 V to about 8.65 V.
2. The red LED on the output shows that the doubled voltage can drive a load.

## What is going on
One NAND gate with a resistor and a capacitor is an oscillator; a second one buffers it. While the buffer is low, the pump capacitor fills from the battery through the first diode. When the buffer jumps high it lifts the whole capacitor by about 5 V, and the second diode passes that higher voltage on to the reservoir. Thousands of times a second, until the reservoir sits near 5 V + 5 V minus what the diodes lose.

## Go further
- [lab-charge-pump](../lab-charge-pump) — the same pump driven by a 555.
- [lab-nand-pips](../lab-nand-pips) — more gate oscillators.
