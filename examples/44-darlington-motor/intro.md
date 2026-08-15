---
level: intermediate
age: 12+
prereqs: [38-npn-switch]
teaches: [darlington, high-gain, buzzer-drive]
---
## What you see
A button drives a buzzer through a Darlington pair — two NPN transistors stacked so the first one's emitter feeds the second one's base. The tiny current from the button is amplified twice, producing enough current to drive the buzzer loudly. A single transistor might struggle; the Darlington pair makes it easy.

## Try this
1. Press the button and listen to the buzzer activate — the Darlington pair provides enough gain.
2. Replace the Darlington with a single transistor and observe whether the buzzer still sounds (it may be weaker or silent).
3. Measure the voltage drop across the Darlington pair when it is on — it should be about 1.2-1.4 V, roughly double a single transistor.

## What is going on
A Darlington pair multiplies the current gain of two transistors. If each transistor has a gain of 100, the pair has a gain of about 10,000. This means a base current of just a few microamps can switch hundreds of milliamps at the collector. The trade-off is a higher saturation voltage (about 1.2 V instead of 0.2 V), which wastes more power as heat. Darlington pairs are commonly packaged as single components (like the TIP120) for driving motors, solenoids, and buzzers.

## Why it matters
Many loads need more current than a microcontroller pin or a single transistor stage can provide. The Darlington configuration solves this without needing a separate driver IC, making it a staple of hobby electronics.

## Go further
- [54-motor-driver](../54-motor-driver) — see a dedicated H-bridge IC for bidirectional motor control.
- [38-npn-switch](../38-npn-switch) — review the single-transistor switch that this example builds upon.
- Experiment: calculate the minimum base current needed to saturate the Darlington pair for a 200 mA buzzer, assuming a combined gain of 5,000.
