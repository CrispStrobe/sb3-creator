---
level: beginner
age: 10+
teaches: [oled, i2c, display, ssd1306]
---
## What you see
A 128×64 OLED display (SSD1306) connected over I²C. The screen shows a
title, then counts upward, updating every half second.

## Try this
1. Run the program — "OLED DEMO" appears on the top line.
2. Change the text in `oled print` to show your name.
3. Use `oled cursor 5 3 on 1` to move to column 5, row 3 before printing.

## What is going on
The SSD1306 is a 128×64 monochrome OLED driven over I²C (address 0x3C).
`oled clear` blanks the screen, `oled cursor` positions the text cursor,
and `oled print` draws text at that position. The `1` at the end is the
display number (device index) — most setups have one display.

## Why it matters
OLEDs are the most common small display for embedded projects. Learning
to clear, position, and print text is the foundation for building
dashboards, status screens, and interactive menus.
