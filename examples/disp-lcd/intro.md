---
level: beginner
age: 10+
teaches: [lcd, i2c, display, hd44780]
---
## What you see
A 16×2 character LCD (HD44780 with I²C backpack) showing a title on row 0
and a counter on row 1 that increments every second.

## Try this
1. Run the program — "LCD DEMO" on top, counter on bottom.
2. `lcd cursor 8 0 on 1` moves to column 8, row 0 — print something there.
3. Try printing numbers: `lcd print (count * 2) on 1`.

## What is going on
The HD44780 LCD uses a PCF8574 I²C backpack (address 0x27). `lcd clear`
resets the display, `lcd cursor col row on 1` positions, `lcd print`
writes text or numbers. Row 0 is the top line, row 1 is the bottom.

## Why it matters
Character LCDs are everywhere — appliances, meters, Arduino projects.
They display 16×2 or 20×4 characters with no graphics overhead.
