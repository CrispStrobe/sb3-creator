# Expected behaviour — The program counter — where the machine is looking

| clocks | LEDs |
|---|---|
| 0 | 0000 |
| 1 | 0001 |
| 9 | 1001 |
| 15 | 1111 + RCO lit |
| 16 | wraps to 0000 |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 13. Off board (rails and parts with no breadboard footprint): 2.

## To build it

| qty | part |
|---|---|
| 1 | 74LS161 4-bit Counter |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 1 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

1 integrated circuit(s), 2 breadboard(s), 5 V.
