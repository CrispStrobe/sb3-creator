# 74C922 physical matrix-keypad encoder

This is a circuit-only bench. `kp1` and `enc1` communicate solely through the
eight visible matrix nets:

| keypad | encoder | role |
|---|---|---|
| r0, r1, r2, r3 | y1, y2, y3, y4 | internally pulled-up sense rows |
| c0, c1, c2, c3 | x1, x2, x3, x4 | open-drain scanned columns |

The encoder is powered from 5 V (`vcc`, `vss`) and `oeb` is tied low. Five
independent 1 kΩ resistor/LED branches display DA and A–D.

After one complete scan, a held key publishes its row-major position:

| position | row,column | D C B A | DA |
|---:|---:|:---:|:---:|
| 0 | 0,0 | 0000 | 1 |
| 1 | 0,1 | 0001 | 1 |
| 2 | 0,2 | 0010 | 1 |
| 3 | 0,3 | 0011 | 1 |
| 4 | 1,0 | 0100 | 1 |
| 5 | 1,1 | 0101 | 1 |
| 6 | 1,2 | 0110 | 1 |
| 7 | 1,3 | 0111 | 1 |
| 8 | 2,0 | 1000 | 1 |
| 9 | 2,1 | 1001 | 1 |
| 10 | 2,2 | 1010 | 1 |
| 11 | 2,3 | 1011 | 1 |
| 12 | 3,0 | 1100 | 1 |
| 13 | 3,1 | 1101 | 1 |
| 14 | 3,2 | 1110 | 1 |
| 15 | 3,3 | 1111 | 1 |

A is bit 0 and D is bit 3. DA is active high and falls after the registered key
is released. OEB is active low; raising it makes A–D high impedance without
gating DA. A second key pressed while the first remains held does not replace
the registered code.

There is deliberately no `key`, `keypad`, or encoder-side `pressed` parameter.
Deleting a matrix wire must make the corresponding row or column undetectable;
otherwise the model has bypassed the physical circuit.
