---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [input-sampling, indirect-store]
---
## Sample log

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Use **Instruments → Switches** to set P1. An open switch reads high and a closed switch reads low. Switch 1 is the least significant bit.

Record three P1 samples in consecutive cells with one indirect store instruction. Load the listing, enter `035 PC`, and use **STEP** until the program counter reaches 047. Before the first, second, and third execution of cell 037, set the whole P1 group to `0x35`, `0x8A`, and `0xC7` respectively. Hold each level through the step at 037. Expect the results below after exactly 25 teaching steps with no programmed delay. **ACC** shows the last sample, `A00.199`. With **RUN** and a constant input the three records contain the same sample. Base memory suffices. The program occupies 035–046, 062–064, and 076–078.

| Cell / Zelle | Word / Wort |
| --- | --- |
| 076 | `00.053` |
| 077 | `00.138` |
| 078 | `00.199` |
