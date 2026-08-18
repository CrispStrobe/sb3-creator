# mb01-display — expected behaviour

## Program

Shows a heart pattern on the 5×5 LED matrix, then scrolls text, then clears.

## Expected MicroPython (Backend-S)

```python
display.show(Image('09900:09900:09900:00000:00000'))
display.scroll('Hello')
display.scroll('BW', delay=int(80))
display.clear()
```

## What this verifies

1. `show pattern` → `display.show(Image('...'))` with colon-separated rows
2. `show text` → `display.scroll(...)` with single-quoted string (pyText)
3. `scroll text ... delay N ms` → `display.scroll(..., delay=int(N))`
4. `clear display` → `display.clear()`
5. Dialect and blocks paths converge on the same MicroPython
