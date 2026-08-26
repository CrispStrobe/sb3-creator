# Expected behaviour — The whole machine — it runs a program

| memory | contents |
|---|---|
| cell 0 | LDA 3 (0011) |
| cell 1 | ADD 3 (0111) |
| cell 2 | OUT (1100) |
| cell 3 | data 5 (0101) |
| after 3 cycles | OUT shows 10 |
| cell 1 -> SUB | OUT shows 0 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 89. Off board (rails and parts with no breadboard footprint): 2.
