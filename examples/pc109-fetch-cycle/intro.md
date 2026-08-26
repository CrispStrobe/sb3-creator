# The fetch cycle — reading an instruction, and knowing what it says

Three timing states, and at the end of them the machine is holding an instruction it understands. T1: the program counter drives the bus and the address register latches it. T2: the counter advances — safe now, because the address is already captured. T3: the RAM drives the bus and the instruction register latches what comes back, which the decoder immediately turns into a lit lamp: LDA, ADD, SUB or OUT. An instruction here is four bits — the top two are the opcode, the bottom two the address it works on — which is what a four-bit bus can honestly carry. Load a program first with the data switches and WRITE, then clock and watch it fetch each one in turn. Notice that only ONE driver is ever enabled: the counter at T1, the RAM at T3, nobody at T2. That is the rule the whole control unit exists to keep.

**Teaches:** fetch sequencing, latched vs transparent registers, one driver at a time

## What to do

Set the DIP switches and watch the outputs. The build needs 6 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| state | what happens |
|---|---|
| T1 | counter drives bus, MAR latches |
| T2 | counter advances, bus idle |
| T3 | RAM drives bus, IR latches |
| 0111 | decodes ADD |
| 1100 | decodes OUT |

## What to buy

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
