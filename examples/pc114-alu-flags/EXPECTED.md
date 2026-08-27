# Expected behaviour — Eight bits, and flags the machine works out for itself

| input | result |
|---|---|
| 200 + 100 | sum 44, carry |
| 255 + 1 | sum 0, carry AND zero |
| 0 - 1 | sum 255, carry clear = borrow |
| 5 - 5 | sum 0, zero, no borrow |
| zero detect | 74HC688 with Q tied low |
| adder | two 74HC283, carry chained |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 47. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 2 | 74HC283 4-bit Adder |
| 1 | 74hc688 |
| 2 | 74HC86 Quad XOR |
| 5 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 8 | LED 2V, yellow |
| 17 | Resistor 10kΩ |
| 10 | Resistor 330Ω |

5 integrated circuit(s), 5 breadboard(s), 5 V.
