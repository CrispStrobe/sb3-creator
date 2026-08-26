# Expected behaviour — A calculator with no computer in it

| A | B | display |
|---|---|---|
| 0 | 0 | 0 |
| 5 | 3 | 8 |
| 4 | 5 | 9 |
| 9 | 1 | blank (10) |
| 15 | 15 | blank, carry lit |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 22. Off board (rails and parts with no breadboard footprint): 2.
