# Expected behaviour — The program counter — where the machine is looking

| clocks | LEDs |
|---|---|
| 0 | 0000 |
| 1 | 0001 |
| 9 | 1001 |
| 15 | 1111 + RCO lit |
| 16 | wraps to 0000 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 13. Off board (rails and parts with no breadboard footprint): 2.
