# mb08-thermometer — expected behaviour

## Program
Reads the on-chip temperature sensor every 2 seconds and shows one of
three icons: a wavy "heat" pattern above 25 °C, a small diamond for
15–25 °C (comfortable), or a large snowflake-like pattern below 15 °C.

## Expected MicroPython (Backend-S)

```python
from microbit import *

temp = 0

async def _task_0():
    global temp
    while True:
        temp = temperature()
        if (temp > 25):
            display.show(Image('09090:90909:09090:90909:09090'))
        else:
            if (temp > 15):
                display.show(Image('00000:00900:09990:00900:00000'))
            else:
                display.show(Image('00900:09990:99999:09990:00900'))
        yield int((2) * 1000)
```

## What this verifies
1. `read temperature` → `temperature()` — built-in sensor reporter
2. `set temp to read temperature` → `temp = temperature()`
3. Chained `IF / ELSE: IF / ELSE:` → nested `if / else: if / else:`
4. `show pattern` → `display.show(Image('...'))` with brightness digits
5. `FOREVER:` → `while True:`
6. Three-way range classification using nested conditionals
