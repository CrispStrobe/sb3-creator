---
level: intermediate
age: 12+
prereqs: [lab-astable-blinker, pc67-555-tongenerator]
teaches: [modulation, 555-control-voltage, diode-switch, siren]
---
## What you see
A red-green blinker made of two transistors, a 555 tone generator with a piezo, and a diode and rheostat between them. The tone jumps between a low and a high note, in step with the lamps.

## Try this
1. Click **Sim** and listen: high, low, high, low. Watch which colour goes with which note.
2. Turn the rheostat down: the high note gets higher. Turn it up: the two notes move closer together.
3. Put a scope on the 555's control pin and on the green LED's transistor. The control voltage drops exactly when green lights.

## What is going on
The 555 makes a tone on its own. Its control pin sets the two voltages at which it switches; normally that pin sits at two thirds of the supply. When the green side of the blinker conducts, its collector is almost at 0 V, and the diode lets the control pin be pulled down through the rheostat. Lower switching voltages mean the 555's capacitor has less far to charge, so it switches faster: a higher note. When red is lit, the green side's collector is high and the diode blocks, so the 555 plays its normal note. One oscillator switching another one: that is how sirens, warble alarms and two-tone horns work.

## Go further
- [pc68-555-sirene](../pc68-555-sirene) — a siren that glides instead of jumping.
- [lab-astable-blinker](../lab-astable-blinker) — the blinker on its own.
