---
level: beginner
age: 10+
prereqs: [pc67-555-tongenerator]
teaches: [conductors, insulators, resistance, 555-timer, sensor-to-frequency]
---
## What you see
A tone generator whose timing resistor has been pulled out on two probe wires. Whatever you hold between the probes decides the pitch: metal shrieks, a pencil line sings high, fruit plays a middle note, skin hums low and plastic stays silent. On the bench, the PROBES switch stands for "something touches both probes" and the MATERIAL knob is that something's resistance.

## Try this
1. Start the simulation. The probes are apart: silence, and the LED is simply on.
2. Close PROBES. With MATERIAL at its start value (47 kΩ, about a piece of fruit) you hear roughly 2 kHz.
3. Turn MATERIAL to 0 (metal) and then up towards 1 MΩ (dry skin). The pitch falls as the resistance rises.
4. Real experiments to try with a real circuit: press the probes deeper into an apple, draw a thick and a thin pencil line, wet a strip of paper. Predict before you listen.

## What is going on
The 555 charges its capacitor through every resistor between +9 V and DISCHARGE. If the probes are bridged by something that conducts, current flows and the chip oscillates; the more resistance in the way, the slower the charging and the lower the note: f = 1.44 / ((R_fixed + R_probe + 2·R2) · C). An insulator lets no current through, so the capacitor never reaches its threshold and there is no tone. Many sensors work exactly like this: a quantity changes a resistance, and an oscillator turns that resistance into a frequency that is easy to count. (A "lie detector" built this way only measures how damp your skin is.)

## Go further
- [lab-tone-keys](../lab-tone-keys): switching fixed resistors instead of probing materials.
- [pc67-555-tongenerator](../pc67-555-tongenerator): the 555 tone generator with fixed parts.
