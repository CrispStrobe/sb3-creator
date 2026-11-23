---
level: intermediate
age: 12+
prereqs: [51-555-astable, 42-diode-rectifier]
teaches: [charge-pump, voltage-doubler, capacitor, diode, output-resistance]
---
## What you see
A 555 timer making a square wave, a pump capacitor, two diodes and a big reservoir capacitor. A blue LED is the load. There is no transformer anywhere, yet the LED is fed from more than 9 V.

## Try this
1. Click **Sim** and put a voltmeter across the reservoir capacitor. Watch it climb past the battery's 9 V and settle around 14 V.
2. Probe the node between the two diodes with an oscilloscope: it jumps between about 9 V and about 18 V.
3. Press **heavy load**. The output drops below 10 V and ripples. Release it and it recovers.
4. Stop the oscillator (pull the 555's reset low). The voltage slowly falls to below 9 V.

## What is going on
When the 555 output is low, the pump capacitor charges from the battery through the first diode to about 9 V. When the output jumps up by 9 V, it lifts the whole capacitor with it — the charged plate now sits near 18 V, and that charge flows through the second diode into the reservoir. Each stroke carries a small packet of charge upwards, like a bucket brigade. Chips use exactly this trick to make higher or negative voltages without a coil. The catch: the packets are small, so a heavy load drains the reservoir faster than the pump fills it.

## Go further
- [51-555-astable](../51-555-astable) — the oscillator on its own.
- [pc31-bridge-rectifier](../pc31-bridge-rectifier) — diodes and a reservoir capacitor fed by AC.
