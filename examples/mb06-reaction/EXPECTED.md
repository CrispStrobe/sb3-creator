# mb06-reaction — expected behaviour

## Program
A button reaction game. Counts down 3–2–1, pauses, then flashes the full
display. The player has ~1 second (20 × 50 ms) to press button A as many
times as possible. The score is stored in variable `score`. Ends with "OK".

## Expected MicroPython (Backend-S)

```python
from microbit import *

score = 0

async def _task_0():
    global score
    display.scroll('3')
    yield int((1) * 1000)
    display.scroll('2')
    yield int((1) * 1000)
    display.scroll('1')
    yield int((1) * 1000)
    display.clear()
    yield int((2) * 1000)
    display.show(Image('99999:99999:99999:99999:99999'))
    score = 0
    for _ in range(int(20)):
        if button_a.is_pressed():
            score = score + 1
        yield int((0.05) * 1000)
    display.scroll('OK')
    yield int((2) * 1000)
    display.clear()
```

## What this verifies
1. `show text` with string literals → `display.scroll(...)`
2. `show pattern` → `display.show(Image(...))`
3. `clear display` → `display.clear()`
4. `set VAR to N` / `change VAR by N` → global variable arithmetic
5. `REPEAT N:` → `for _ in range(int(N)):`
6. `IF read button_a THEN:` → `if button_a.is_pressed():`
7. `wait N seconds` → `yield int((N) * 1000)`
8. Countdown sequence + timed reaction window
