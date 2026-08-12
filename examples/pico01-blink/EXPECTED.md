# pico01-blink — expected behaviour

## Circuit

MCU GP25 → green LED (Vf = 2.1 V) → 220 Ω resistor → GND.

Active-high: GP25 high drives current through the LED. The RP2040 has
true push-pull GPIO outputs at 3.3 V.

## Program

Toggles GP25 at 1 Hz: 500 ms on, 500 ms off, forever.

## Observable behaviour

| time (ms) | GP25 level | LED state | LED current |
|---|---|---|---|
| 0 | high (3.3 V) | ON | (3.3 − 2.1) / 220 = 5.5 mA |
| 500 | low (0 V) | OFF | 0 mA |
| 1000 | high (3.3 V) | ON | 5.5 mA |

- **Frequency:** 1 Hz (period = 1000 ms)
- **Duty cycle:** 50%
- **LED current:** 5.5 mA (within the RP2040's 12 mA max per pin)

## What this verifies

1. `DEVICE PICO` parses and compiles to a freestanding RP2040 binary
2. Active-high wiring: `turn on led1` drives GP25 HIGH via SIO
3. Hardware timer delay via TIMER TIMELR (no bw_ms counter)
4. Single-task cooperative scheduler on RP2040
5. Full chain: generateC → arm-none-eabi-gcc (rp2040) → binary + symbol table

## Difference from the Arduino blink

The Pico runs at 3.3 V (not 5 V) and 125 MHz (not 16 MHz). The LED
current is lower (5.5 mA vs 13.2 mA). The delay uses the hardware
microsecond timer (TIMELR) instead of a software millisecond counter.
