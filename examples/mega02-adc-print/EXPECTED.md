# mega02-adc-print — expected behaviour

## Circuit

Potentiometer wiper → MCU A9 (one of the Mega's 16 ADC channels).
5 V across the pot, wiper to A9. The ATmega2560 has ADC channels 0–15
(A0–A15); A9 corresponds to ADC channel 9 (port K, bit 1).

## Program

Reads A9 every second and prints the 10-bit ADC value (0–1023) over serial.

## Observable behaviour

| pot position | A9 voltage | ADC reading | serial output |
|---|---|---|---|
| 0% | 0 V | 0 | `0` |
| 50% | 2.5 V | 511–512 | `511` or `512` |
| 100% | 5.0 V | 1023 | `1023` |

Readings print once per second, continuously.

## What this verifies

1. `DEVICE ARDUINO-MEGA` with a high-numbered ADC pin (A9, beyond A0–A5)
2. ADC channel mapping for the ATmega2560 (channels 8–15 use ADCL/ADCH + MUX5)
3. Serial print of an analog reading
4. Single-task cooperative scheduler

## Why A9 specifically

A0–A5 are shared with all AVR boards and exercised by the generic examples.
A9 is Mega-only (port K, ADC MUX bits [4:0] = 01001 with MUX5 set) and
exercises the extended MUX logic that the 2560 adds over the 328P.
