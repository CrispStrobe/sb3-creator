# lab-speaker-click — expected behaviour

## Circuit
- 4.5 V battery, push button, 22 Ω series resistor, an ammeter and an 8 Ω loudspeaker (`speaker_8`).
- Two slide switches (`slide_switch_5`, `slide_switch_6`) form a reversing switch: both on the left, the speaker's lead A goes to plus; both on the right, lead A goes to minus.

## Observable behaviour
- Button open: no current.
- Button pressed: the current jumps to 0.1485 A (4.5 V over 22 Ω + 8 Ω) and stays there. The speaker reports a click (level about 0.17) that dies away; 400 ms into the press it is silent (level 0).
- Button released: a second click of the same size.
- Both slide switches moved to the right: the ammeter reads −0.1485 A. The force on the cone, and with it the cone's displacement, is reversed.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`.

| state | ammeter | speaker level |
|---|---|---|
| open | 0 | 0 |
| first 40 ms of the press | 0.1485 A | peak ≈ 0.17 |
| held 400 ms | 0.1485 A | 0 |
| reversed, held | −0.1485 A | — |

## What this verifies
1. A loudspeaker responds to changes of current; a steady current only displaces the cone.
2. The current's direction sets the direction of the force.

## Simulation notes
The engine's speaker reads loudness as the running RMS of the AC part of its coil current (rated current 0.25 A for 0.5 W into 8 Ω). The cone's displacement is not a separate output; its direction is the sign of the coil current.

```assert
# power-on, button open: the battery, and no current anywhere
net vsource_2.pos V 4.50 +-0.01
net speaker_8.a V 0.00 +-0.01
net resistor_4.b V 0.00 +-0.01
```
