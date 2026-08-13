# 168p01-blink — expected behaviour

## Circuit

MCU D13 → green LED (Vf = 2.1 V) → 220 Ω resistor → GND.

Active-high: D13 high drives current through the LED. Same pin mapping as
the ATmega328P — the 168P shares the same pinout but has half the flash
(16 KB vs 32 KB).

## Program

Toggles D13 at 1 Hz: 500 ms on, 500 ms off, forever.

## Observable behaviour

| time (ms) | D13 level | LED state | LED current |
|---|---|---|---|
| 0 | high (5 V) | ON | (5.0 − 2.1) / 220 = 13.2 mA |
| 500 | low (0 V) | OFF | 0 mA |
| 1000 | high (5 V) | ON | 13.2 mA |

## What this verifies

1. `DEVICE ATMEGA168P` parses and compiles to the ATmega168P target
2. The codegen is identical to the 328P — same registers, same timer
3. Full chain: generateC → avr-gcc (atmega168p) → hex → symbol table
4. The 16 KB flash limit is not exceeded by a simple blink (typically <2 KB)

## Difference from Uno/Nano blink

Electrically identical — the 168P and 328P are pin-compatible. The only
difference is the compile target (`-mmcu=atmega168p`) and the smaller flash.
