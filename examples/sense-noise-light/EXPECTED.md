# sense-noise-light -- expected behaviour

## Circuit

- Sound module: VCC and GND from the rails, analog output `ao` -> MCU P1.3
  (ADC). AO = level x VCC, so silence is 0 V and the loudest sound 5 V.
- VCC (5 V) -> 1 kOhm -> green LED -> MCU P1.0 (active-low).
- VCC (5 V) -> 1 kOhm -> yellow LED -> MCU P1.1 (active-low).
- VCC (5 V) -> 1 kOhm -> red LED -> MCU P1.2 (active-low).

## Program

Each round takes 20 readings 10 ms apart (200 ms) and keeps the largest one,
the peak. Then exactly one LED is lit: red above 700, yellow above 400,
otherwise green (readings 0..1023).

A 12-bit ADC (Pico, STM32F030) reads 0..4095 instead of 0..1023, so the
same input gives a larger number and these raw thresholds are crossed at a
lower level than on a 10-bit board. The program works on every board; only
the switching point moves.

## Observable behaviour

| sound level | AO voltage   | peak reading | LED    |
|-------------|--------------|--------------|--------|
| 0.0         | 0.0 V        | 0            | green  |
| 0.5         | 2.5 V        | ~512         | yellow |
| 0.8         | 4.0 V        | ~818         | red    |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Reading an analog sensor that drives a voltage (no divider needed)
2. Peak detection over a short window of samples
3. Three bands from two thresholds with nested IF/ELSE

```assert
# Silent room at start: AO, and the ADC pin, at 0 V.
net SOUND_mic.ao V 0.00 +-0.01
net MCU.P1.3 V 0.00 +-0.01
```
