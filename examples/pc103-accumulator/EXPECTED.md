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
