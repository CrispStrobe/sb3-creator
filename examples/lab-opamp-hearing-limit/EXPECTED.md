# lab-opamp-hearing-limit — expected behaviour

## Circuit
- 9 V supply. LM324 section 1 as a relaxation oscillator: + input on three 10 kΩ from +9 V, ground and the output (thresholds 3 V and 5.5 V); the output charges 10 nF (capacitor_9) on the − input through 2.2 kΩ and the PITCH rheostat (potentiometer_8, 100 kΩ; as built at half).
- Loudspeaker (speaker_12) through 10 µF and 1 kΩ.

## Observable behaviour
- PITCH down (102 kΩ): about 660 Hz.
- Half way: about 1.27 kHz.
- PITCH up (2.2 kΩ): about 14.5 kHz, high enough that many adults no longer hear it. Here the op-amp's slew rate (0.3 V/µs) already takes a large part of each half-period: the square's edges are ramps of about 24 µs.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: 664 Hz, 1266 Hz, 14 463 Hz.

## What this verifies
1. The period of an RC relaxation oscillator is proportional to R: 102 kΩ against 2.2 kΩ would be a factor of 46.
2. At the top the slew rate, not the RC, sets the limit: the measured factor is only 22.

## Simulation notes
The speaker sits behind 1 kΩ so that the op-amp's output (40 mA at most) is not loaded down and the thresholds stay where they are.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.1_pos V 3.015 +-0.03
```
