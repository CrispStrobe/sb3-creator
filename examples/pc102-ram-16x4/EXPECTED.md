# Expected behaviour — Memory — sixteen places to put a number

| action | what you see |
|---|---|
| store 5 | LEDs read 10 (inverted!) |
| store 0 | LEDs read 15 |
| clock | address advances |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 26. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74LS161 4-bit Counter |
| 1 | 74LS189 16x4 RAM |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, yellow |
| 6 | Resistor 10kΩ |
| 8 | Resistor 330Ω |

2 integrated circuit(s), 3 breadboard(s), 5 V.
