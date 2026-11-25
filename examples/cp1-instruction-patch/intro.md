---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [two-byte-words, self-modifying-code]
---
## Instruction patch

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Copy a complete teaching word into a later instruction cell, then execute the changed instruction.

Cell 069 starts as `04.014`. Enter `066 PC RUN` to copy the full instruction word `04.197` from cell 078 to cell 069 and jump to it. Expect `P  071`, then `A00.197` on **ACC**, and `C04.197` after `069 OUT`. Reload the listing to see the original word again. The run executes five teaching instructions, with no programmed delay. Base memory suffices. The program occupies 066–070 and 078 and needs no terminal connections.
