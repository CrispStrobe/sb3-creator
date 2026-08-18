# mb02-sensors — expected behaviour

## Program

Reads accelerometer X, light level, and temperature every 500 ms.

## Expected MicroPython (Backend-S)

```python
ax = accelerometer.get_x()
lux = display.read_light_level()
deg = temperature()
```

## What this verifies

1. `read accel x` → `accelerometer.get_x()` (oracle M1)
2. `read light` → `display.read_light_level()` (oracle E1)
3. `read temperature` → `temperature()` (oracle E2)
4. Sensor reporters appear as expressions in variable assignments
5. Dialect and blocks paths converge on the same MicroPython
