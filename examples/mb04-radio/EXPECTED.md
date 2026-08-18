# mb04-radio — expected behaviour

## Program

Configures radio on group 5 at power 3, then sends accelerometer X
readings every second.

## Expected MicroPython (Backend-S)

```python
import radio
radio.config(group=int(5), power=int(3))
radio.on()
val = accelerometer.get_x()
radio.send(str(val))
```

## What this verifies

1. `radio on group 5 power 3` → `radio.config(...)` + `radio.on()` (oracle R1)
2. `radio send number val` → `radio.send(str(val))` (oracle R2)
3. `import radio` is auto-added to the header
4. Sensor reporters compose with radio send
5. Dialect and blocks paths converge on the same MicroPython
