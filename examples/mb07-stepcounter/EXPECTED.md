# mb07-stepcounter — expected behaviour

## Program
A pedometer using the built-in accelerometer. Reads the Z-axis acceleration
in a loop and detects a step when it exceeds 1500 mg. A rising-edge latch
(`was_high`) prevents counting the same step twice. Each step briefly flashes
an upward-arrow pattern on the display.

## Expected MicroPython (Backend-S)

```python
from microbit import *

steps = 0
was_high = 0

async def _task_0():
    global steps, was_high
    steps = 0
    was_high = 0
    while True:
        acc = accelerometer.get_z()
        if (acc > 1500):
            if (was_high == 0):
                steps = steps + 1
                was_high = 1
                display.show(Image('00900:00900:09990:00900:00900'))
                yield int((0.3) * 1000)
                display.clear()
        else:
            was_high = 0
        yield int((0.1) * 1000)
```

## What this verifies
1. `read accel z` → `accelerometer.get_z()`
2. `IF ... THEN: / ELSE:` → `if ... : / else:`
3. Nested `IF` blocks compile correctly
4. `change VAR by 1` → `VAR = VAR + 1`
5. `show pattern` / `clear display` inside conditional
6. `FOREVER:` → `while True:`
7. Rising-edge detection pattern (latch variable)
