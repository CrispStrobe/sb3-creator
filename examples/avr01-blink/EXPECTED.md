# avr01-blink — expected behaviour

## Circuit

MCU D13 → green LED (Vf = 2.1 V) → 220 Ω resistor → GND.

Active-high: D13 high drives current through the LED. This is the standard
Arduino wiring — opposite to the STC12 active-low path in 01-blink. The
ATmega328P has true push-pull outputs, not quasi-bidirectional pins.

## Program

Toggles D13 at 1 Hz: 500 ms on, 500 ms off, forever.

## Observable behaviour

| time (ms) | D13 level | LED state | LED current |
|---|---|---|---|
| 0 | high (5 V) | ON | (5.0 − 2.1) / 220 = 13.2 mA |
| 500 | low (0 V) | OFF | 0 mA |
| 1000 | high (5 V) | ON | 13.2 mA |

- **Frequency:** 1 Hz (period = 1000 ms)
- **Duty cycle:** 50%
- **LED current:** 13.2 mA (within the ATmega328P's 40 mA absolute max per pin)

## What this verifies

1. Active-high wiring: `turn on led1` drives D13 HIGH, not LOW
2. Timer-based wait: 500 ms from Timer0 CTC at F_CPU/64, not a _delay_ms loop
3. The cooperative scheduler runs a single task correctly
4. The full chain: generateC → avr-gcc → Intel HEX → avr8js → pin toggles

## Difference from 01-blink (STC12)

The STC12 version wires VCC → R → LED → P1.0 (active-low, quasi-bidirectional).
This version wires D13 → LED → R → GND (active-high, push-pull). The program
is identical; the circuit and the electrical path are different because the
chips are different.
