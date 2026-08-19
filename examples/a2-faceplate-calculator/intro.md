---
level: beginner
age: 8+
prereqs: []
teaches: [variables, conditionals, controller-panel, keypad-widget, lcd-widget]
---

## A2 Calculator (Faceplate)

A chain calculator that runs entirely on the controller panel — no circuit
wiring needed. The 4×4 keypad widget replaces the A2 board's red key matrix,
and the LCD widget replaces the 8-digit 7-segment display.

## Try this

1. Click the green flag.
2. Press digit keys on the keypad (7 8 9 / 4 5 6 * 1 2 3 - 0 . = +).
3. Press **=** to evaluate. The LCD shows the result.
4. Press the **C** button to clear everything.
5. Try **DEL** to erase the last digit, **+/-** to negate.

## What is going on

The keypad widget writes the pressed key's label to the `key_input` variable.
The program reads that variable each tick, builds up an expression, and writes
the running value to `lcd_text`. The LCD widget reads `lcd_text` and displays
it — no hardware scan loop, no 7-segment font table, just variables flowing
through the controller panel.

This is the same calculator logic as example 78 (A2 calculator), but without
any circuit — the faceplate is the entire interface.
