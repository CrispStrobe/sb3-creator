# Expected behaviour — Subtraction is the same circuit

| mode | A | B | result |
|---|---|---|---|
| + | 7 | 2 | 9 |
| − | 7 | 2 | 5, carry lit (no borrow) |
| − | 2 | 7 | 11, carry dark (borrowed) |
| + | 15 | 1 | 0, carry lit |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 24. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC283 4-bit Adder |
| 1 | 74HC86 Quad XOR |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 9 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

2 integrated circuit(s), 3 breadboard(s), 5 V.
