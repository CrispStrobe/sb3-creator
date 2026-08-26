# The full adder (carry in, carry out)

Two XORs, two ANDs and an OR: A + B + a carry coming IN. That third input is the whole point — it is what lets adders be chained, each one handing its carry to the next. Close all three switches: 1+1+1 = 11 in binary, so SUM lights AND CARRY lights.

**Teaches:** why adders chain: the carry input

## What to do

Set the DIP switches and watch the outputs. The build needs 2 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | Cin | SUM | CARRY |
|---|---|---|---|---|
| 0 | 0 | 0 | off | off |
| 1 | 0 | 0 | ON | off |
| 1 | 1 | 0 | off | ON |
| 1 | 1 | 1 | ON | ON |
