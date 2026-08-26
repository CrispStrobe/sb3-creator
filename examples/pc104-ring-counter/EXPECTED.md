# Expected behaviour — The ring counter — six beats to every instruction

| clocks | active state |
|---|---|
| 0 | T1 |
| 1 | T2 |
| 5 | T6 |
| 6 | T1 again |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 15. Off board (rails and parts with no breadboard footprint): 2.
