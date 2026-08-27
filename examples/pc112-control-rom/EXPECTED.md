# Expected behaviour — The control ROM — a control word you can program

| step | control word |
|---|---|
| T1 | Ep, Lm — every opcode |
| T2 | Cp |
| T3 | CE, Li |
| T4 (LDA/ADD/SUB) | Ei, Lm |
| T4 (OUT) | Ea, Lo |
| T5 (ADD) | CE, Lb |
| T6 (SUB) | Eu, La, Su |
| unknown opcode | fetches, then nothing |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 41. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 1 | 74LS161 4-bit Counter |
| 2 | 4-way DIP Switch (SPST) |
| 7 | LED 2V, green |
| 4 | LED 2V, red |
| 4 | LED 2V, yellow |
| 5 | Resistor 10kΩ |
| 15 | Resistor 330Ω |

2 integrated circuit(s), 4 breadboard(s), 5 V.
