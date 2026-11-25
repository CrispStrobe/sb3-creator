---
level: intermediate
age: 12+
prereqs: [lab-mosfet-vcr]
teaches: [humidity-sensor, mosfet, high-impedance-input, sensor-threshold]
---
## What you see
A little board with two copper combs whose fingers interleave, coated with a thin film of salt. It connects the battery to the gate of a MOSFET. A green LED waits in the drain line.

## Try this
1. Click **Sim**. In normal room air the green LED stays dark.
2. Open the stimulus panel and slide the humidity up slowly. At what humidity does the LED begin to glow?
3. Press **Breath** (about 90 %): the LED lights at once, as if you had breathed on the comb.
4. Slide back to **Dry** or **Room**: the comb dries and the LED goes out.
5. Turn the response knob under the red LED up and find the new switching humidity.

## What is going on
Dry salt does not conduct. But a salt film soaks up water from the air, and the dissolved salt ions can then carry a current between the combs. The more water, the more ions are free to move: the resistance falls about tenfold for every 12 % of humidity. In room air the comb has about 10 MΩ, far more than the 100 kΩ to ground, so the gate stays near 0 V, below the source, and the channel is pinched off. Breathe on it and the comb drops to a few kilohms: now it wins the tug-of-war, the gate rises and the MOSFET conducts. A MOSFET is the right amplifier here because its gate takes no current at all, so even a sensor of many megohms can control it. The knob under the source lifts it further, so the gate has to rise higher: that is how you set the response point.

## Go further
- [lab-mosfet-vcr](../lab-mosfet-vcr) — how the gate voltage sets the channel.
- [lab-dual-gate](../lab-dual-gate) — the second gate of the same transistor.
