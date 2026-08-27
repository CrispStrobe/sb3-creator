# Expected behaviour — The machine again, with a ROM where the matrix was

| what | value |
|---|---|
| program | LDA 3, ADD 3, OUT, data 5 |
| output | 10, exactly as pc110 |
| control chips | 10 -> 2 |
| decoder | gone — the opcode is address bits |
| step counter | binary, not one-hot |
| microcode | 32 rows per ROM |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 81. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,12,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 3 | 74HC04 Hex NOT |
| 2 | 74HC08 Quad AND |
| 5 | 74HC244 Octal Tri-State Buffer |
| 1 | 74HC283 4-bit Adder |
| 1 | 74HC86 Quad XOR |
| 2 | 74LS161 4-bit Counter |
| 5 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 2 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 4 | LED 2V, red |
| 11 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 23 | Resistor 330Ω |

21 integrated circuit(s), 9 breadboard(s), 5 V.
