# The control matrix — the part that decides

Set an opcode, then clock through the six timing states and watch the control lines fire in order. T1 puts the program counter on the bus (Ep, Lm); T2 advances it (Cp); T3 fetches the instruction (CE, Li) — that much is the same for every instruction. From T4 the opcode takes over: LDA loads the accumulator from memory, ADD routes through the B register and the adder, SUB does the same with Su asserted, OUT copies the accumulator to the display. Every lamp here is one AND term OR-ed with the others that drive the same line. A hardwired control unit is nothing more than that array — this is the piece that makes the registers, the memory and the adder into a computer.

**Teaches:** hardwired control, AND-OR arrays, the fetch-execute cycle

## What to do

Set the DIP switches and watch the outputs. The build needs 5 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| instruction | state | lines asserted |
|---|---|---|
| any | T1 | Ep, Lm |
| any | T2 | Cp |
| any | T3 | CE, Li |
| LDA | T5 | CE, La |
| ADD | T6 | Eu, La |
| SUB | T6 | Eu, La, Su |
| OUT | T4 | Ea, Lo |
