# mb05-lesson — expected behaviour

## Program

A guided first project: shows a heart pattern on the 5×5 LED matrix,
then loops checking buttons. Press A to read the temperature and scroll
"T:", press B to read the light level and scroll "L:".

## Expected MicroPython (Backend-S)

```python
display.show(Image('09090:99999:99999:09990:00900'))
button_a.is_pressed()
temperature()
display.scroll('T:')
button_b.is_pressed()
display.read_light_level()
display.scroll('L:')
```

## What this verifies

1. `show pattern` → `display.show(Image('...'))` (oracle D1)
2. `read button_a` → `button_a.is_pressed()` in condition context (oracle B2)
3. `read temperature` → `temperature()` (oracle E2)
4. `read light` → `display.read_light_level()` (oracle E1)
5. `show text` → `display.scroll(...)` with single-quoted string (oracle D2)
6. Button reporters work inside IF conditions (pyCond path)
7. Dialect and blocks paths converge on the same MicroPython
