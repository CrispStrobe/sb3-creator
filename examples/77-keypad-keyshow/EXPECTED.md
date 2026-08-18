# Expected behaviour

- Idle: the digit is blank (all segments off).
- Pressing keypad key `1` (row 0, col 0) shows `1`; key `#` (row 3,
  col 2) shows `E` (key index 14); key `D` shows `F`.
- The shown value persists until another key is pressed.
- Electrical: with a key held, its column node follows the driven row
  (active-low) through the keypad's 0.1 Ω bridge.
