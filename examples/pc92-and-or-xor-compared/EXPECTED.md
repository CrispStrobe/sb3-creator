# Expected behaviour — AND, OR and XOR side by side

| A | B | AND | OR | XOR |
|---|---|---|---|---|
| 0 | 0 | off | off | off |
| 1 | 0 | off | ON | ON |
| 0 | 1 | off | ON | ON |
| 1 | 1 | ON | ON | off |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 12. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC08 Quad AND |
| 1 | 74HC32 Quad OR |
| 1 | 74HC86 Quad XOR |
| 1 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 1 | LED 2V, yellow |
| 2 | Resistor 10kΩ |
| 3 | Resistor 330Ω |

3 integrated circuit(s), 2 breadboard(s), 5 V.
