# Expected behaviour — The fetch cycle — reading an instruction, and knowing what it says

| state | what happens |
|---|---|
| T1 | counter drives bus, MAR latches |
| T2 | counter advances, bus idle |
| T3 | RAM drives bus, IR latches |
| 0111 | decodes ADD |
| 1100 | decodes OUT |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 61. Off board (rails and parts with no breadboard footprint): 2.
