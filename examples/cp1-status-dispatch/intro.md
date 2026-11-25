---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [indirect-jump, input-validation]
---
## Status dispatch

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Use **Instruments → Switches** to set P1. An open switch reads high and a closed switch reads low. Switch 1 is the least significant bit.

The whole P1 byte selects a status handler. Values 0, 1 and 2 index a table of jump instructions. Higher bytes enter a fallback handler. Drive all eight input bits before entering `082 PC RUN` and hold them through halt. Check the table, then repeat from 082 for each input. The valid routes execute nine teaching instructions and the fallback executes five, with no programmed delay. Base memory suffices. The program occupies 082–095, 110–112, and 114–116.

| P1 | PC | ACC |
| --- | --- | --- |
| `0x00` | 090 | `A00.017` |
| `0x01` | 092 | `A00.071` |
| `0x02` | 094 | `A00.143` |
| `0x03` or / oder `0xFF` | 096 | `A00.239` |
