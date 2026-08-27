# The control ROM — a control word you can program

The same control table as C6, and not one gate computes it. Four switches are the opcode, a 74LS161 counts the six steps, and together they ADDRESS two EEPROMs whose contents ARE the control word. C6 needs new gates for every instruction and grows as instructions x states; this needs new bytes. That is why SAP-2, SAP-3 and every real CPU after them are microcoded. Note the counter: a one-hot ring says which state as a lit wire, and a ROM address wants a number.

**Teaches:** microcode: the control word is fetched, not computed; why real CPUs are microcoded

## What to do

Set the DIP switches and watch the outputs. The build needs 4 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

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

## What to buy

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
