# Expected behaviour — AND, OR and XOR side by side

| A | B | AND | OR | XOR |
|---|---|---|---|---|
| 0 | 0 | off | off | off |
| 1 | 0 | off | ON | ON |
| 0 | 1 | off | ON | ON |
| 1 | 1 | ON | ON | off |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 12. Off board (rails and parts with no breadboard footprint): 2.
