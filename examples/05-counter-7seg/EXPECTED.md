# 05-counter — expected behaviour

## Circuit

- VCC → push button → MCU P3.2 (input), with 10 kΩ pull-down to GND.
- VCC → 1 kΩ → red LED → MCU P1.0 (active-low).

## Program

Waits for button press, increments counter (0–9, wraps), blinks LED
`count` times, then waits 500 ms before accepting the next press.

## Observable behaviour

| press # | count | LED blinks | total blink time |
|---|---|---|---|
| 1 | 1 | 1 × (200ms on + 200ms off) | 400 ms |
| 2 | 2 | 2 × 400 ms | 800 ms |
| 5 | 5 | 5 × 400 ms | 2000 ms |
| 10 | 0 (wrapped) | 0 blinks | 0 ms |

## What this verifies

1. Button input with `wait until read button`
2. Counter variable with wrap-around
3. `REPEAT count:` with a variable count
4. Sequential blink pattern
