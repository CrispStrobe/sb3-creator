# Expected behaviour — The half adder (XOR + AND)

| A | B | SUM | CARRY |
|---|---|---|---|
| 0 | 0 | off | off |
| 1 | 0 | ON | off |
| 0 | 1 | ON | off |
| 1 | 1 | off | ON |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 9. Off board (rails and parts with no breadboard footprint): 2.
