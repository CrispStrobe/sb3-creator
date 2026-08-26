# The whole machine — it runs a program

Twenty-five chips, one bus, and a program in memory. Load four cells by hand, then do nothing but clock: the machine fetches each instruction, works out what it means, and moves the data itself. LDA loads the accumulator from memory, ADD and SUB route through the B register and the adder, OUT copies the accumulator to the output register. An instruction is two bits of opcode and two bits of address, so the program and its data live in the first four cells. Write LDA 3, ADD 3, OUT, and 5 into cells 0 to 3 and the output lands on ten. Five different things can drive the bus here and exactly one ever does — that single rule, held by the control matrix, is what separates a computer from a pile of registers.

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
