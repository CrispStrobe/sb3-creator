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

## To build it

| qty | part |
|---|---|
| 3 | 74HC04 Hex NOT |
| 4 | 74HC08 Quad AND |
| 1 | 74HC138 3-to-8 Decoder |
| 5 | 74HC244 Octal Tri-State Buffer |
| 1 | 74HC283 4-bit Adder |
| 2 | 74HC32 Quad OR |
| 1 | 74HC86 Quad XOR |
| 1 | 74LS161 4-bit Counter |
| 5 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 1 | CD4017 Decade Counter |
| 2 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 4 | LED 2V, red |
| 14 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 26 | Resistor 330Ω |

25 integrated circuit(s), 9 breadboard(s), 5 V.
