# 11-toggle-button -- expected behaviour

## Circuit

VCC (5 V) -> 1 kOhm resistor -> green LED (Vf = 2.0 V) -> MCU P1.0 (active-low).
Button on P3.2 with 10 kOhm pull-up to VCC; button press connects P3.2 to GND.

## Program

Waits for button press (P3.2 goes LOW), toggles the LED, debounces with 50 ms delay,
then waits for button release before accepting the next press.

## Observable behaviour

| event          | P3.2 level | P1.0 level | LED state |
|----------------|------------|------------|-----------|
| idle           | high (1)   | high (1)   | OFF       |
| 1st press      | low (0)    | low (0)    | ON        |
| 1st release    | high (1)   | low (0)    | ON        |
| 2nd press      | low (0)    | high (1)   | OFF       |
| 2nd release    | high (1)   | high (1)   | OFF       |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Debounce delay:** 50 ms after each toggle
- **Pull-up current (idle):** 5.0 / 10000 = 0.5 mA

## What this verifies

1. Button input reading with active-low pull-up wiring
2. Toggle operation (alternates LED state each press)
3. Software debounce via 50 ms wait
4. Wait-until construct for edge detection

```assert
# Button open: pull-up holds input at VCC = 5.000V
net R_PU_btn.b V 5.00 +-0.01
```
