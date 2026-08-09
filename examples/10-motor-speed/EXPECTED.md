# 10-motor-speed — expected behaviour

## Circuit

- VCC → DC motor (R = 10 Ω, kV = 0.01 V/rad/s) → MCU P1.0 (output).
  Software PWM toggles the pin; the motor integrates the duty cycle.
- VCC → 10 kΩ pot → GND. Wiper → MCU P1.3 (ADC channel 3).

Note: a real circuit would need a MOSFET driver for the motor current.
Pedagogically simplified — the circuit teaches the pot → ADC → PWM → motor
control loop.

## Program

Reads the pot (0–1023), uses LSB to toggle the motor pin at ~1 kHz.
Full pot → ~50% duty cycle, motor runs at moderate speed.

## Observable behaviour

| pot position | ADC reading | duty cycle | motor state |
|---|---|---|---|
| 0% | ~0 | bit 0 = 0 → always off | stopped |
| 25% | ~256 | bit 0 = 0 → off | stopped |
| 50% | ~512 | bit 0 = 0 → off | stopped |
| 100% | ~1023 | bit 0 = 1 → ~50% | running |

Note: this is a simplified example using bit 0 as the PWM source.
A proper PWM implementation would compare the ADC reading against a
counter for proportional speed control.

## What this verifies

1. DC motor as a circuit-only part (driven via pin output)
2. Pot → ADC → computed pin write control loop
3. The motor device model in the engine (R, kV, back-EMF)
