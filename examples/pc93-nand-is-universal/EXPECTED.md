# Expected behaviour — NAND is universal

| A | B | NOT A | A AND B | A OR B |
|---|---|---|---|---|
| 0 | 0 | ON | off | off |
| 1 | 0 | off | off | ON |
| 0 | 1 | ON | off | ON |
| 1 | 1 | off | ON | ON |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 11. Off board (rails and parts with no breadboard footprint): 2.
