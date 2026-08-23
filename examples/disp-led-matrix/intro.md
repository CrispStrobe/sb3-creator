---
level: beginner
age: 10+
teaches: [led-matrix, max7219, spi, pixel]
---
## What you see
An 8×8 LED matrix (MAX7219) with a column of lit pixels scrolling left to
right. Each step lights a full column and clears the previous one.

## Try this
1. Run the program — a vertical bar sweeps across the matrix.
2. Change `set pixel row N` lines to light only specific rows for patterns.
3. Add a second matrix and address it with `on 2` instead of `on 1`.

## What is going on
The MAX7219 drives an 8×8 LED matrix over SPI (DIN, CS, CLK). `clear matrix`
blanks the display, `set pixel col row on 1` lights one LED. The program
sweeps a column across 8 positions at 200 ms intervals.

## Why it matters
LED matrices are used for scrolling text, simple graphics, and status
indicators. The MAX7219 handles multiplexing so the MCU only sends data.
