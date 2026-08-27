# Expected behaviour — Eight bits wide, and it holds a number the last one cannot

| what | value |
|---|---|
| program | LDA 3, ADD 3, OUT, data 100 |
| output | 200 — no nibble holds it |
| RAM | 2 x 74LS189 = 16 bytes |
| adder | 2 x 74HC283, carry chained |
| address path | still 4 bits — 16 cells is all there is |
| microcode | the same table as pc117 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 117. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 4 | 74HC04 Hex NOT |
| 2 | 74HC08 Quad AND |
| 8 | 74HC244 Octal Tri-State Buffer |
| 2 | 74HC283 4-bit Adder |
| 2 | 74HC86 Quad XOR |
| 2 | 74LS161 4-bit Counter |
| 9 | 74LS173 4-bit Register |
| 2 | 74LS189 16x4 RAM |
| 3 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 8 | LED 2V, red |
| 15 | LED 2V, yellow |
| 8 | Resistor 100kΩ |
| 10 | Resistor 10kΩ |
| 31 | Resistor 330Ω |

32 integrated circuit(s), 13 breadboard(s), 5 V.
