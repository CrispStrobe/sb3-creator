# Expected behaviour — The full adder (carry in, carry out)

| A | B | Cin | SUM | CARRY |
|---|---|---|---|---|
| 0 | 0 | 0 | off | off |
| 1 | 0 | 0 | ON | off |
| 1 | 1 | 0 | off | ON |
| 1 | 1 | 1 | ON | ON |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 11. Off board (rails and parts with no breadboard footprint): 2.
