# The machine again, with a ROM where the matrix was

The same computer as C10, running the same program to the same answer — and ten chips of control logic have become two EEPROMs. Load LDA 3, ADD 3, OUT and 5 into cells 0 to 3, clock, and the output lands on ten, exactly as before. The datapath below the control unit is C10's wire for wire; only how the control word is produced has changed. There is no decoder either, because a ROM does not need one: the opcode IS part of the address. What changes is what happens next — a matrix grows a gate per instruction, a ROM grows a row, and the instruction set becomes a file you can edit rather than a board you must rewire.

**Teaches:** a microcoded CPU and a hardwired one are the same machine; what differs is what happens next

## What to do

Set the DIP switches and watch the outputs. The build needs 9 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| what | value |
|---|---|
| program | LDA 3, ADD 3, OUT, data 5 |
| output | 10, exactly as pc110 |
| control chips | 10 -> 2 |
| decoder | gone — the opcode is address bits |
| step counter | binary, not one-hot |
| microcode | 32 rows per ROM |

## What to buy

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
