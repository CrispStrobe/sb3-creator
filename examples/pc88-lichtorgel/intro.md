---
level: advanced
age: 14+
prereqs: [pc05-npn-switch]
teaches: [sound-module, transistor-stages, colour-organ, audio-reactive]
---
## What you see
A colour organ: three LED groups (red, green, blue) respond to sound level. Quiet → only red lights. Louder → green joins. Loud → all three colours. A sound module provides the analog signal, three NPN transistor stages with different base resistors form the thresholds.

## Try this
1. Click **Sim** — the LEDs respond to the module's sound level.
2. Change the level: low → red only; medium → red+green; high → all three.
3. The base resistors set the thresholds: 10 kΩ (sensitive, red), 22 kΩ (medium, green), 47 kΩ (least sensitive, blue).

## What is going on
The sound module outputs an analog voltage (AO) proportional to sound level. Each transistor stage has a different base resistor: a smaller resistor means more base current at the same input voltage, so it switches on earlier. This creates three thresholds — a qualitative level split through sensitivity stages.

## Go further
- [pc05-npn-switch](../pc05-npn-switch) — the transistor switch as a building block.
- [pc72-tagschaltung](../pc72-tagschaltung) — a sensor driving a transistor (light instead of sound).
