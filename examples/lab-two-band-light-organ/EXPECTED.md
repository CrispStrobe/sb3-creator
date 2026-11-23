# lab-two-band-light-organ — expected behaviour

## Circuit
9 V. A sine source (4 V peak, 50 Hz as loaded) stands in for the music. Treble path: 22 nF in series, 10 kΩ to ground
(high-pass), then 47 kΩ into the base of an NPN with a blue LED and 470 Ω in its collector. Bass path: 4.7 kΩ in series,
1 µF to ground (low-pass), then 47 kΩ into a second NPN with a red LED and 470 Ω. A 10 kΩ from each collector to +9 V.

## Observable behaviour
- Change the source frequency and compare the LEDs (average LED currents):

| frequency | treble (blue) | bass (red) |
|---|---|---|
| 20 Hz | 0.00 mA | 1.38 mA |
| 50 Hz | 0.00 mA | 0.71 mA |
| 100 Hz | 0.00 mA | 0.19 mA |
| 300 Hz | 0.28 mA | 0.00 mA |
| 1000 Hz | 1.21 mA | 0.00 mA |
| 3000 Hz | 1.62 mA | 0.00 mA |

- Low notes light the red LED, high notes the blue one; in between both are weak.
- The corner frequencies are 1 / (2π × 10 kΩ × 22 nF) ≈ 720 Hz for the treble path and 1 / (2π × 4.7 kΩ × 1 µF) ≈ 34 Hz
  for the bass path; the transistors need about 0.7 V on top, so each LED fades out somewhat inside its own band.

## Simulation note
The 10 kΩ from each collector to +9 V only keeps the collector voltage defined while its transistor is off; the
simulator cannot settle a node held only by a dark LED. It carries no current that matters.

## What this verifies
1. A capacitor passes high frequencies and blocks low ones; across a capacitor it is the other way round.
2. Two first-order filters split one signal into two bands.

```assert
# t = 1 ms: the sine is at 1.24 V, both drivers still off
net vsource_3.pos V 1.24 +-0.02
net npn_7.collector V 9.00 +-0.02
net npn_14.collector V 9.00 +-0.02
```
