---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [indirect-addressing, tables]
---
## Lookup card

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Add an offset to a table address, then read the word through the computed pointer.

Read index 4 from a six-value calibration table, where index 0 is the first entry. Enter `038 PC RUN`. The program adds the index to the start address and saves the resulting pointer `00.058` in cell 051. The indirect load fetches `00.123` from cell 058. Expect `P  043`, then `A00.123` on **ACC**. The run executes five teaching instructions, with no programmed delay. Base memory suffices. The program occupies 038–042, 050–051, and 054–059 and needs no terminal connections.
