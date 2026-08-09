# 26-debounce -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).
Button on P3.2 with 10 kOhm pull-up to VCC; button press connects P3.2 to GND.

## Program

Waits for button press (P3.2 LOW), waits 50 ms, rechecks the pin. Only toggles
the LED if the button is still pressed after the debounce delay. Then waits for
release with another 50 ms debounce.

## Observable behaviour

| event             | P3.2 level | action              | LED change |
|-------------------|------------|---------------------|------------|
| glitch (< 50 ms)  | low->high  | recheck fails       | none       |
| real press         | low (held) | recheck passes      | toggles    |
| release            | high (1)   | wait for next press | none       |

- **Debounce window:** 50 ms
- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Pull-up current (idle):** 5.0 / 10000 = 0.5 mA
- **False triggers rejected:** any bounce shorter than 50 ms

## What this verifies

1. Software debounce: wait then recheck pattern
2. IF/THEN conditional to validate button state after delay
3. Toggle operation only on confirmed presses
4. Wait-until for both press and release edge detection
