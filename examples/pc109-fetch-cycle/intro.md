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
