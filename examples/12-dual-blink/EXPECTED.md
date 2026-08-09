# 12-dual-blink -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).
VCC (5 V) -> 1 kOhm -> blue LED (Vf = 2.0 V) -> MCU P1.1 (active-low).

## Program

Alternates the two LEDs at 1 Hz: when led1 is on, led2 is off, and vice versa.

## Observable behaviour

| time (ms) | P1.0 | P1.1 | LED1 (red) | LED2 (blue) |
|-----------|------|------|------------|-------------|
| 0         | low  | high | ON         | OFF         |
| 500       | high | low  | OFF        | ON          |
| 1000      | low  | high | ON         | OFF         |

- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Frequency:** 1 Hz per LED (period = 1000 ms)
- **Duty cycle:** 50% each
- **Phase relationship:** 180 degrees out of phase (anti-phase)
- **Total supply current:** always 3.0 mA (one LED on at a time)

## What this verifies

1. Independent control of two active-low outputs
2. Anti-phase alternation pattern
3. Constant total current draw regardless of which LED is on
