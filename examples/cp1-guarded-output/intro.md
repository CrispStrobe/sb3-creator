---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [boolean-logic, cp1-input, output]
---
## Guarded output

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

Set terminals 2 and 7 with the panel’s external P1 controls. The LED connects to P2.4, which is teaching terminal 5.

P2 terminal 5 goes high only when P1 terminal 2 is high and P1 terminal 7 is low. Set those two input levels before entering `030 PC RUN` and hold them until halt. Start each test at 030. Expect `P  037` after seven teaching instructions with no programmed delay. **ACC** shows the output bit as `A00.000` or `A00.001`. The program preserves the other P2 output bits. Base memory suffices. It occupies 030–036 and 046.

| P1 terminal 2 | P1 terminal 7 | P2 terminal 5 | P2 with other bits high / P2 mit übrigen Bits High |
| --- | --- | --- | --- |
| Low | Low | Low | `0xEF` |
| Low | High | Low | `0xEF` |
| High | Low | High | `0xFF` |
| High | High | Low | `0xEF` |
