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

## To build it

| qty | part |
|---|---|
| 2 | 74HC04 Hex NOT |
| 1 | 74HC08 Quad AND |
| 1 | 74HC138 3-to-8 Decoder |
| 2 | 74HC244 Octal Tri-State Buffer |
| 1 | 74LS161 4-bit Counter |
| 2 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 1 | CD4017 Decade Counter |
| 2 | 4-way DIP Switch (SPST) |
| 6 | LED 2V, green |
| 5 | LED 2V, red |
| 8 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 19 | Resistor 330Ω |

11 integrated circuit(s), 6 breadboard(s), 5 V.
