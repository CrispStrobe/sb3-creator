# lab-octave-divider — expected behaviour

## Circuit
5 V supply.

- **Oscillator:** a 555 astable, 1 kΩ + 6.8 kΩ and 22 nF (control pin 10 nF): about 4.44 kHz.
- **Divider:** two 74HC93 ripple counters in a chain. In each, QA feeds its own input B, so QA..QD count in binary; the first counter's QD clocks the second. Seven stages in all: first QA, QB, QC, QD, then second QA, QB, QC. (The 74HC93 pair stands in for a single CMOS 7-stage binary counter.) The resets are grounded, the second counter's QD is unused.
- **Mixer:** each of the seven outputs feeds 47 kΩ into one summing node; 10 µF couples the mix into a crystal earphone.

## Observable behaviour
Every stage toggles on the falling edge of the one before, so each runs at half the frequency of its input:

| output | divides by | frequency |
|---|---|---|
| 555 | 1 | 4.44 kHz |
| counter 1 QA | 2 | 2.22 kHz |
| counter 1 QB | 4 | 1.11 kHz |
| counter 1 QC | 8 | 555 Hz |
| counter 1 QD | 16 | 278 Hz |
| counter 2 QA | 32 | 139 Hz |
| counter 2 QB | 64 | 69 Hz |
| counter 2 QC | 128 | 35 Hz |

- Seven octaves from one oscillator: each output is one octave below the previous one, all exactly in tune with each other, because they come from the same clock.
- The earphone plays all seven together: a buzzy organ-like chord. Disconnect a summing resistor to drop that octave from the mix.
- Changing the 555's timing (another capacitor) shifts all seven octaves together.

## What this verifies
1. Each flip-flop stage of a binary counter divides its input frequency by two.
2. Chained stages give 2, 4, 8 ... 128: a frequency divider, the way electronic organs once made their lower octaves.

```assert
# t = 1 ms: the 555's control pin at 2/3 of the supply; four clock edges so far
# (count 4: only the first counter's QC is high).
net timer_555_3.control V 3.333 +-0.01
net 74hc93_8.qc V 4.99 +-0.05
net 74hc93_8.qa V 0.00 +-0.05
net 74hc93_8.qb V 0.00 +-0.05
```
