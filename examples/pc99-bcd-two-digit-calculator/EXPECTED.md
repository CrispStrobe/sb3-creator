# Expected behaviour — Two digits: the calculator that does not give up at nine

| A | B | display |
|---|---|---|
| 3 | 4 | 07 |
| 9 | 0 | 09 |
| 9 | 1 | 10 |
| 7 | 6 | 13 |
| 9 | 9 | 18 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 32. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC08 Quad AND |
| 2 | 74HC283 4-bit Adder |
| 1 | 74HC32 Quad OR |
| 2 | CD4511 BCD-to-7-Segment Decoder |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 8 | Resistor 10kΩ |
| 14 | Resistor 330Ω |
| 2 | 7-Segment Display |

6 integrated circuit(s), 4 breadboard(s), 5 V.
