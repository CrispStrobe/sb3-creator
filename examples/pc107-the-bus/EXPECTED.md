# Expected behaviour — The bus — one set of wires, many talkers

| enabled | bus |
|---|---|
| neither | 0000 |
| A only | shows A |
| B only | shows B |
| both | neither 1 nor 0 — contention |

Asserted by simulation in bw-circuit-ui's test/logic-ladder.test.js (the same circuit, wire for wire) and re-checked seated in test/logic-examples.test.js.

Parts on a board: 28. Off board (rails and parts with no breadboard footprint): 2.
