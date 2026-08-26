# Expected behaviour — The ring counter — six beats to every instruction

| clocks | active state |
|---|---|
| 0 | T1 |
| 1 | T2 |
| 5 | T6 |
| 6 | T1 again |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 15. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | CD4017 Decade Counter |
| 1 | 4-way DIP Switch (SPST) |
| 5 | LED 2V, green |
| 1 | LED 2V, yellow |
| 1 | Resistor 10kΩ |
| 6 | Resistor 330Ω |

1 integrated circuit(s), 2 breadboard(s), 5 V.
