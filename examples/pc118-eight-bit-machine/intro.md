# Eight bits wide, and it holds a number the last one cannot

The same machine as C16 with the data path widened: two 74LS189s instead of one, two 74HC283s carry-chained, two registers per register. Nothing conceptual changes — the microcode is the same table — and that is worth seeing once, because widening is the part people expect to be hard and it is only more of the same. What changes is what the machine can HOLD. Load LDA 3, ADD 3, OUT and 100, and the output reads 200: a number four bits cannot represent at all. The ADDRESS path stays four bits on purpose — an instruction is four bits of opcode and four of operand, so sixteen cells is the whole memory and a wider counter would address nothing.

**Teaches:** widening is mechanical; what changes is the range, not the idea

## What to do

Set the DIP switches and watch the outputs. The build needs 13 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| what | value |
|---|---|
| program | LDA 3, ADD 3, OUT, data 100 |
| output | 200 — no nibble holds it |
| RAM | 2 x 74LS189 = 16 bytes |
| adder | 2 x 74HC283, carry chained |
| address path | still 4 bits — 16 cells is all there is |
| microcode | the same table as pc117 |

## What to buy

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 4 | 74HC04 Hex NOT |
| 2 | 74HC08 Quad AND |
| 8 | 74HC244 Octal Tri-State Buffer |
| 2 | 74HC283 4-bit Adder |
| 2 | 74HC86 Quad XOR |
| 2 | 74LS161 4-bit Counter |
| 9 | 74LS173 4-bit Register |
| 2 | 74LS189 16x4 RAM |
| 3 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 8 | LED 2V, red |
| 15 | LED 2V, yellow |
| 8 | Resistor 100kΩ |
| 10 | Resistor 10kΩ |
| 31 | Resistor 330Ω |

32 integrated circuit(s), 13 breadboard(s), 5 V.
