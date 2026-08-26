# Expected behaviour — The full adder (carry in, carry out)

| A | B | Cin | SUM | CARRY |
|---|---|---|---|---|
| 0 | 0 | 0 | off | off |
| 1 | 0 | 0 | ON | off |
| 1 | 1 | 0 | off | ON |
| 1 | 1 | 1 | ON | ON |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 11. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC08 Quad AND |
| 1 | 74HC32 Quad OR |
| 1 | 74HC86 Quad XOR |
| 1 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 3 | Resistor 10kΩ |
| 2 | Resistor 330Ω |

3 integrated circuit(s), 2 breadboard(s), 5 V.
