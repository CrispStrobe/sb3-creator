# Expected behaviour — The accumulator — a circuit with a past

| action | total |
|---|---|
| +3, clock 1 | 3 |
| clock 2 | 6 |
| clock 3 | 9 |
| no clock | unchanged |
| MR | 0 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 20. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC283 4-bit Adder |
| 1 | 74LS173 4-bit Register |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 6 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

2 integrated circuit(s), 2 breadboard(s), 5 V.
