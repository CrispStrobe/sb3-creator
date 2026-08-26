# Expected behaviour — The control matrix — the part that decides

| instruction | state | lines asserted |
|---|---|---|
| any | T1 | Ep, Lm |
| any | T2 | Cp |
| any | T3 | CE, Li |
| LDA | T5 | CE, La |
| ADD | T6 | Eu, La |
| SUB | T6 | Eu, La, Su |
| OUT | T4 | Ea, Lo |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 51. Off board (rails and parts with no breadboard footprint): 2.
