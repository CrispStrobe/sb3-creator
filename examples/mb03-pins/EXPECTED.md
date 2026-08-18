# mb03-pins — expected behaviour

## Program

Exercises digital and analog pin operations on P0, P1, P2.

## Expected MicroPython (Backend-S)

```python
pin0.write_digital(1)
pin0.write_digital(0)
val = pin0.read_digital()
aval = pin1.read_analog()
pin2.write_analog(int(50 / 100 * 1023))
```

## What this verifies

1. `set pin P0 to 1` → `pin0.write_digital(1)` (oracle P3)
2. `pin P0 digital` → `pin0.read_digital()` (pin reporter)
3. `analog value of pin P1` → `pin1.read_analog()` (pin reporter)
4. `set pin P2 analog 50 %` → `pin2.write_analog(int(50 / 100 * 1023))` (oracle P5)
5. Dialect and blocks paths converge on the same MicroPython
