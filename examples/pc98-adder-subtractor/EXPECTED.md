# Expected behaviour — Subtraction is the same circuit

| mode | A | B | result |
|---|---|---|---|
| + | 7 | 2 | 9 |
| − | 7 | 2 | 5, carry lit (no borrow) |
| − | 2 | 7 | 11, carry dark (borrowed) |
| + | 15 | 1 | 0, carry lit |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 24. Off board (rails and parts with no breadboard footprint): 2.
