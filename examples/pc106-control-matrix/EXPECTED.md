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

## To build it

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 2 | 74HC08 Quad AND |
| 2 | 74HC138 3-to-8 Decoder |
| 2 | 74HC32 Quad OR |
| 1 | CD4017 Decade Counter |
| 2 | 4-way DIP Switch (SPST) |
| 9 | LED 2V, green |
| 4 | LED 2V, red |
| 5 | LED 2V, yellow |
| 5 | Resistor 10kΩ |
| 18 | Resistor 330Ω |

8 integrated circuit(s), 5 breadboard(s), 5 V.
