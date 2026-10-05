# binary-counter-buttons -- expected behaviour

## Circuit

- Buttons `up` (P3.2) and `down` (P3.3), each with a 10 kOhm pull-up to VCC;
  pressing connects the pin to GND (active-low).
- Five LEDs b0..b4, each VCC (5 V) -> 1 kOhm -> LED -> MCU P1.0..P1.4
  (active-low). Place values: b0 = 1, b1 = 2, b2 = 4, b3 = 8, b4 = 16.

## Program

`value` starts at 0. Each press of `up` adds 1 (31 wraps to 0), each press of
`down` subtracts 1 (0 wraps to 31). After every change the procedure
`show value` lights the LEDs by taking away place values from largest to
smallest, and the value is printed. Each press is acted on once: the program
waits for the release before reading the buttons again.

## Observable behaviour

| value | b4 b3 b2 b1 b0 |
|-------|----------------|
| 0     | 0  0  0  0  0  |
| 1     | 0  0  0  0  1  |
| 5     | 0  0  1  0  1  |
| 10    | 0  1  0  1  0  |
| 24    | 1  1  0  0  0  |
| 31    | 1  1  1  1  1  |

- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **All five on:** 5 x 3.0 = 15.0 mA

## What this verifies

1. Binary place values with five outputs
2. A procedure that converts a number to an output pattern
3. Two buttons with wrap-around counting, one step per press

```assert
# Buttons released: the pull-ups hold both inputs at VCC.
net R_PU_up.b V 5.00 +-0.01
net R_PU_down.b V 5.00 +-0.01
```
