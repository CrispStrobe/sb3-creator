# The whole machine — it runs a program

Twenty-five chips, one bus, and a program in memory. Load four cells by hand, then do nothing but clock: the machine fetches each instruction, works out what it means, and moves the data itself. LDA loads the accumulator from memory, ADD and SUB route through the B register and the adder, OUT copies the accumulator to the output register. An instruction is two bits of opcode and two bits of address, so the program and its data live in the first four cells. Write LDA 3, ADD 3, OUT, and 5 into cells 0 to 3 and the output lands on ten. Five different things can drive the bus here and exactly one ever does — that single rule, held by the control matrix, is what separates a computer from a pile of registers. Keep clocking past OUT and the answer garbles, which is not a fault: a two-bit opcode has room for exactly four instructions and all four are spent, so there is no HALT. The counter runs on into cell 3, reads the DATA there as though it were an instruction, and obeys it. Every real machine needs either a halt or a jump for this reason, and neither fits in two bits.

**Teaches:** the stored-program idea, bus discipline, fetch-execute end to end

## What to do

Set the DIP switches and watch the outputs. The build needs 9 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| memory | contents |
|---|---|
| cell 0 | LDA 3 (0011) |
| cell 1 | ADD 3 (0111) |
| cell 2 | OUT (1100) |
| cell 3 | data 5 (0101) |
| after 3 cycles | OUT shows 10 |
| cell 1 -> SUB | OUT shows 0 |

## What to buy

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
