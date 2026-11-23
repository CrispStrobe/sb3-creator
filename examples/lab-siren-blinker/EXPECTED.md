# lab-siren-blinker — expected behaviour

## Circuit
9 V. A two-transistor blinker: collectors each with 470 Ω and an LED (Q1 red, Q2 green), 4.7 µF
electrolytics cross-coupled to the bases, base resistors 47 kΩ (Q1) and 56 kΩ (Q2). A 555 astable makes the
tone: 1 kΩ and 10 kΩ, 220 nF, output through 220 Ω into a piezo. The 555's control-voltage pin goes through a
10 kΩ rheostat (authored at the middle) and a diode (cathode at the blinker) to Q2's collector.

## Observable behaviour
- The blinker swaps red and green roughly every 0.15 s.
- Red lit (Q2 off): Q2's collector is high, the diode blocks, the control pin sits at its own 6.0 V and the
  555 sounds its plain tone of about 309 Hz (1.44 / ((1 kΩ + 2 · 10 kΩ) · 220 nF) = 312 Hz).
- Green lit (Q2 on): Q2's collector is low, the diode conducts and, through the 5 kΩ of the half-turned
  rheostat, pulls the control pin down to about 3.9 V.
  The 555's thresholds drop with it, the capacitor has less far to charge and the pitch jumps to about 419 Hz.
- So the two tones alternate in step with the two lamps: a two-tone siren with matching lights.
- The rheostat sets how far apart the two tones are: less resistance pulls the control pin further down and
  the high tone gets higher.
- The blinker is deliberately fast. Bigger electrolytics make the alternation slower.

## What this verifies
1. One oscillator can steer another: a diode as a switch on the control input is frequency modulation by a
  square wave.
2. The 555's control pin moves both thresholds, and with them the frequency.

```assert
# t = 1 ms: supply up, the 555's output starts high
net vsource_2.pos V 9.00 +-0.01
net timer_555_13.output V 9.00 +-0.05
```
