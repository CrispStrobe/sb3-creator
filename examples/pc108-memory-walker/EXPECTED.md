# Expected behaviour — The machine reads its own memory

| action | data LEDs |
|---|---|
| write 3,9,5,12 | into cells 0-3 |
| then clock | cell 0 shows 3 |
| clock | 9 |
| clock | 5 |
| clock | 12 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 42. Off board (rails and parts with no breadboard footprint): 2.
