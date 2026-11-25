---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [arithmetic, conditional-branch]
---
## Crate division

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Use repeated subtraction to find how many crates can be filled and how many items are left.

Split 83 items into full crates of nine. Enter `020 PC RUN`. The program subtracts nine from the items left only when enough remain to fill another crate. Expect `P  035`, then `A00.002` on **ACC**. Cell 039 contains the remainder `00.002`, and cell 040 contains the quotient `00.009`. The run executes 90 teaching instructions, with no programmed delay. Base memory suffices. The program occupies 020–034 and 039–042 and needs no terminal connections.
