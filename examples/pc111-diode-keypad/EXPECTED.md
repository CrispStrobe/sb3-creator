# Expected behaviour — A decimal keypad made of diodes

| key | bit lines |
|---|---|
| 1 | 0001 |
| 5 | 0101 |
| 9 | 1001 |
| 1 and 2 together | 0011 — a digit nobody pressed |
| 0 / nothing | both 0000 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 30. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 15 | Diode |
| 2 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 3 | LED 2V, green |
| 1 | LED 2V, red |
| 4 | Resistor 10kΩ |
| 4 | Resistor 330Ω |

0 integrated circuit(s), 3 breadboard(s), 5 V.
