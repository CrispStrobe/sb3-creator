# Expected behaviour — The instruction decoder — a number becomes a meaning

| opcode | decoded |
|---|---|
| 0000 | LDA |
| 0001 | ADD |
| 0010 | SUB |
| 1110 | OUT |
| 1111 | HLT |
| 0111 | nothing — not an instruction |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 17. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 2 | 74HC138 3-to-8 Decoder |
| 1 | 4-way DIP Switch (SPST) |
| 3 | LED 2V, green |
| 1 | LED 2V, red |
| 1 | LED 2V, yellow |
| 4 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

2 integrated circuit(s), 2 breadboard(s), 5 V.
