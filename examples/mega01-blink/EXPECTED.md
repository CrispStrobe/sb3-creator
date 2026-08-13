# mega01-blink — expected behaviour

## Circuit

MCU D13 → green LED (Vf = 2.1 V) → 220 Ω resistor → GND.

Active-high: D13 high drives current through the LED. Same D13 pin as
Uno/Nano — the ATmega2560's PB7 is mapped to Arduino digital pin 13.

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
- **LED current:** 13.2 mA (within 40 mA absolute max per pin)

## What this verifies

1. `DEVICE ARDUINO-MEGA` parses and generates C for the ATmega2560
2. Active-high wiring: `turn on led1` drives D13 HIGH
3. Timer-based wait via Timer0 CTC at F_CPU/64
4. Single-task cooperative scheduler on Mega
5. Full chain: generateC → avr-gcc (atmega2560) → hex → symbol table

## Difference from Uno/Nano blink

Electrically identical — D13 is PB7 on all three boards. The Mega has 54
digital pins (D0–D53) and 16 analog channels (A0–A15), exercised in the
other Mega examples.
