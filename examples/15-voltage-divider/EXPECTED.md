# 15-voltage-divider -- expected behaviour

## Circuit

Voltage divider: VCC (5 V) -> R1 (10 kOhm) -> junction -> R2 (10 kOhm) -> GND.
Junction connected to MCU P1.7 (ADC input).
Indicator: VCC -> 1 kOhm -> green LED (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Reads the ADC at the divider junction. If above midpoint (512 of 1024), LED on; else off.

## Observable behaviour

- **Junction voltage:** VCC x R2 / (R1 + R2) = 5.0 x 10000 / 20000 = 2.50 V
- **ADC reading (10-bit, 0-1023):** 2.50 / 5.0 x 1024 = 512
- **LED state:** ON (reading equals threshold, so just at boundary)
- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Divider current:** 5.0 / 20000 = 0.25 mA
- **Divider power:** 5.0 x 0.25 mA = 1.25 mW
- **Sampling rate:** every 100 ms (10 Hz)

## What this verifies

1. Resistive voltage divider produces VCC/2 with equal resistors
2. ADC reading of analog voltage via P1.7
3. Threshold comparison to drive a digital output
