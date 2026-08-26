# Expected behaviour — NAND is universal

| A | B | NOT A | A AND B | A OR B |
|---|---|---|---|---|
| 0 | 0 | ON | off | off |
| 1 | 0 | off | off | ON |
| 0 | 1 | ON | off | ON |
| 1 | 1 | off | ON | ON |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 11. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 2 | 74HC00 Quad NAND |
| 1 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 1 | LED 2V, yellow |
| 2 | Resistor 10kΩ |
| 3 | Resistor 330Ω |

2 integrated circuit(s), 1 breadboard(s), 5 V.
