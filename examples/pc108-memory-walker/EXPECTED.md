# Expected behaviour — The machine reads its own memory

| action | data LEDs |
|---|---|
| write 3,9,5,12 | into cells 0-3 |
| then clock | cell 0 shows 3 |
| clock | 9 |
| clock | 5 |
| clock | 12 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 42. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 1 | 74HC08 Quad AND |
| 1 | 74HC244 Octal Tri-State Buffer |
| 1 | 74LS161 4-bit Counter |
| 1 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, red |
| 4 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 12 | Resistor 330Ω |

6 integrated circuit(s), 4 breadboard(s), 5 V.
