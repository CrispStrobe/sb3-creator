---
level: beginner
age: 8+
prereqs: []
teaches: [variables, conditionals, expressions, controller-panel, oled-display]
---
## What you see
A calculator with 17 buttons (0-9, + - * / = C .) and an OLED display.
Type a calculation on the buttons and press = to see the result.

## Try this
1. Click **Run on Simulator** to start the calculator.
2. Press 1, +, 2, then = — the display shows "1 + 2" and the result "= 3".
3. Press C to clear and try a multiplication: 6 * 7 =.
4. Try chaining operations: 10 + 20 - 5 =.

## What is going on
Each button is a controller-panel widget bound to a Scratch variable.
When you press a button, it sets its variable to 1. The program checks
each variable every tick, appends the corresponding character to the
expression string, and resets the variable to 0. The OLED display widget
reads the `oled_text` variable and renders it as text rows — a 128x64
OLED abstracted as 4 lines of 21 characters.
