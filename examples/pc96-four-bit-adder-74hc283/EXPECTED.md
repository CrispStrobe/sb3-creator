# Expected behaviour — 4-bit adder on one chip (74HC283)

| A | B | Cout + SUM |
|---|---|---|
| 0000 | 0000 | 0 0000 |
| 0101 | 0011 | 0 1000 |
| 1111 | 0001 | 1 0000 |
| 1111 | 1111 | 1 1110 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 21. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC283 4-bit Adder |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 8 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

1 integrated circuit(s), 2 breadboard(s), 5 V.
