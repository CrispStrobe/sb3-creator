# microbit01-hello — expected behaviour

## Program

The first program on a bare micro:bit. There is no breadboard: the 5×5 LED
matrix and the two face buttons are the whole circuit, which is why this
example ships no `circuit.json`.

Green flag scrolls `HELLO`, shows a heart, clears, then loops:

- **Button A** — counts one more greeting into the `greetings` variable and
  scrolls `HI`.
- **Button B** — resets `greetings` to 0 and shows the heart again.

## Expected MicroPython (Backend-S)

```python
from microbit import *

greetings = 0

def _task_0():
    global greetings
    greetings = 0
    display.scroll('HELLO')
    display.show(Image('09090:99999:99999:09990:00900'))
    yield int((1) * 1000)
    display.clear()
    while True:
        if (button_a.is_pressed() > 0):
            greetings = greetings + 1
            display.scroll('HI')
            yield int((0.3) * 1000)
            display.clear()
        if (button_b.is_pressed() > 0):
            greetings = 0
            display.show(Image('09090:99999:99999:09990:00900'))
            yield int((0.3) * 1000)
            display.clear()
        yield int((0.1) * 1000)
        yield 0
```

## What this verifies

1. `show text` → `display.scroll('...')` with a single-quoted string (pyText)
2. `show pattern R:R:R:R:R` → `display.show(Image('...'))`, rows colon-separated
3. `clear display` → `display.clear()`
4. `read button_a` / `read button_b` → `button_X.is_pressed()`
5. `set VAR to N` / `change VAR by N` → a module-level global, declared once and
   rebound under `global` inside the task
6. `wait N seconds` → `yield int((N) * 1000)`, and `FOREVER` closes with the
   bare `yield 0` back-edge the scheduler needs
7. A device-only example: program plus board, no circuit file, and the gallery's
   "no circuit iff device-only" equivalence holds for it

**Not verified on hardware** — the MicroPython above is the compiler's output,
read against the micro:bit API, not measured on a bench.
