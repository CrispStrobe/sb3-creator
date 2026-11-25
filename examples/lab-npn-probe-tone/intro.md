---
level: beginner
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, resistance, conductors, sound]
---
## What you see
A transistor tone generator with two probe tips. The **PROBES** switch says whether the tips touch something; the **MATERIAL** pot stands for what they touch, from metal (0) to dry skin (far end). A yellow LED, a **HIGH** slide switch and the earphone.

## Try this
1. Click **Sim**. The probes are apart, as if they touched an insulator: silence.
2. Close **PROBES**. As authored the material is a piece of fruit: a medium whistle.
3. Turn **MATERIAL** down to 0 (metal, or a pencil line rubbed thick): a high whistle. This is a continuity tester.
4. Turn it up towards dry skin: the pitch falls a long way. Think of blotting paper getting wetter, or palms getting sweaty, as turning it back down: the pitch rises (a rain alarm, a "lie detector").
5. Watch the LED: the more the material resists, the brighter it gets.
6. Move **HIGH** to the small capacitor: the same probe now gives a shrill whistle, around 10 kHz.

## What is going on
Whatever is between the tips is the resistor that recharges the first transistor's base after each switching. A good conductor recharges it quickly and the circuit switches often: a high note. A poor conductor recharges it slowly: a low note. An insulator never recharges it: no note at all. The 22 kΩ guard resistor keeps the base safe when the tips touch metal. The LED is lit while the first transistor is held off, which grows with the resistance.

## Go further
- [lab-pitch-probe](../lab-pitch-probe) — the same probe on a timer chip.
