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
2. Change the byte 255 in the column command to light a subset of its eight LEDs.

## What is going on
The MAX7219 drives the matrix through DIN, CS and CLK. Each command
shifts a register address and a data byte into the chip. The program writes
one column and clears it again after 200 ms.

## Why it matters
LED matrices are used for scrolling text, simple graphics, and status
indicators. The MAX7219 handles multiplexing so the MCU only sends data.
