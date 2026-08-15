---
level: beginner
age: 8+
prereqs: []
teaches: [diode-polarity, forward-bias, reverse-bias]
---
## What you see
A diode in series with an LED. When the diode is forward-biased, current flows and the LED lights up. Reverse the diode, and the LED goes dark — the diode blocks current in one direction like a one-way valve.

## Try this
1. Run the simulation and confirm the LED is on — current flows through the forward-biased diode.
2. Reverse the diode's orientation and observe the LED turn off — no current flows in reverse.
3. Check the voltage drop across the forward-biased diode — it should be about 0.7 V for a silicon diode.

## What is going on
A diode is a semiconductor device that conducts current in only one direction. In forward bias (anode positive, cathode negative), it conducts with a small voltage drop, typically 0.7 V for silicon. In reverse bias, it blocks current almost completely. The LED serves as a visual indicator of whether current is flowing. This one-way behaviour is the basis of rectification — converting AC to DC.

## Why it matters
Diodes protect circuits from reversed power connections and convert alternating current to direct current. Every phone charger, power supply, and solar panel controller uses diodes. Knowing which way current flows is fundamental to reading any schematic.

## Go further
- [39-zener-clamp](../39-zener-clamp) — see a special diode that conducts in reverse at a specific voltage.
- [28-diode-polarity](../28-diode-polarity) — explore polarity protection in more detail.
- Experiment: add a second diode in series (same direction) and measure the total voltage drop — it should double to about 1.4 V.
