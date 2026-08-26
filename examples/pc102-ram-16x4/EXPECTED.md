# Expected behaviour — Memory — sixteen places to put a number

| action | what you see |
|---|---|
| store 5 | LEDs read 10 (inverted!) |
| store 0 | LEDs read 15 |
| clock | address advances |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 26. Off board (rails and parts with no breadboard footprint): 2.
