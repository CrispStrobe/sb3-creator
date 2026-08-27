# Expected behaviour — A stack — the thing CALL and RET are made of

| action | what happens |
|---|---|
| push 3, 7, 12 | SP goes 0 -> 3 |
| pop | 12 |
| pop | 7 |
| pop | 3 |
| 16 pushes | SP wraps to 0 — no depth check |
| clocks | idle HIGH, count on release |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 28. Off board (rails and parts with no breadboard footprint): 3.

## To build it

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 1 | 74LS189 16x4 RAM |
| 1 | 74ls193 |
| 2 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, red |
| 8 | Resistor 10kΩ |
| 8 | Resistor 330Ω |

3 integrated circuit(s), 3 breadboard(s), 5 V.
