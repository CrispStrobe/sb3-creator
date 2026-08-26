# Expected behaviour — The bus — one set of wires, many talkers

| enabled | bus |
|---|---|
| neither | 0000 |
| A only | shows A |
| B only | shows B |
| both | neither 1 nor 0 — contention |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 28. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 2 | 74HC244 Octal Tri-State Buffer |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 10 | Resistor 10kΩ |
| 4 | Resistor 330Ω |

3 integrated circuit(s), 3 breadboard(s), 5 V.
