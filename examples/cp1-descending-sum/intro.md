---
level: foundation
age: 11+
prereqs: [cp1-first-display]
teaches: [arithmetic, loops]
---
## Descending sum

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Add the current value into a running total and reduce it each time through the loop.

Add the integers from 7 down through 1. Load the program, enter `010 PC RUN`, and wait for `P  025`. Press **ACC** for `A00.028`. Cell 030 contains `00.000` and cell 031 contains `00.028`. A comparison to zero ends the loop before another subtraction. The run executes 72 teaching instructions, with no programmed delay. Base memory suffices. The program occupies 010–024 and 030–033 and needs no terminal connections.
