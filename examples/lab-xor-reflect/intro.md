---
level: advanced
age: 14+
prereqs: [lab-colour-sensor, lab-nand-pips]
teaches: [synchronous-detection, exclusive-or, nand-logic, infrared, light-barrier]
---
## What you see
An infrared LED that flashes about 570 times a second, a white surface that reflects it, a phototransistor, logic gates and an op-amp. A green LED means "object in front". A yellow LED shows what a plain light barrier would see.

## What to do
1. Click **Sim**. The surface is 2 cm away: the green LED is lit.
2. Move the surface's **distance** knob to the far end. The green LED goes out.
3. Now raise the phototransistor's **light** slider (a lamp in the room) to the middle. The yellow LED lights up, as if something were there, but the green LED stays dark.
4. Turn the lamp off and bring the surface back: green again.

## What is going on
Four NAND gates make an exclusive-OR, which is low only when its two inputs agree. One input is the clock that flashes the LED, the other is what the phototransistor receives. Light reflected from the surface arrives exactly in step with the clock, so they always agree. A lamp gives steady light, which agrees with the clock only half of the time. The op-amp averages the result and decides. This is synchronous detection, the trick behind remote controls and dust-proof light barriers.

## Go further
- [lab-colour-sensor](../lab-colour-sensor) — a reflection sensor without the clock trick.
- [lab-light-link](../lab-light-link) — a flashing light beam carrying a signal.
