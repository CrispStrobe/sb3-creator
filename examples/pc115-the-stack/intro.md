# A stack — the thing CALL and RET are made of

The same 16x4 RAM as C2, with a 74LS193 supplying the address instead of the program counter — and the 193 is the point, because a 74LS161 counts one way, so a pointer built from one could push and never pop. Push is: set the switches, pulse /WE to store at [SP], then pulse PUSH to advance. Pop is: pulse POP to retreat, THEN read. That order is the whole discipline — a pop that reads before it retreats hands back the empty slot above the top of the stack, which looks like corrupted memory and is really a counter clocked one moment too late. Push three numbers and pop them: they come back in the opposite order, which is the property that makes a return address survive a nested call.

**Teaches:** LIFO from a RAM and an up/down counter; why pop must retreat before it reads

## What to do

Set the DIP switches and watch the outputs. The build needs 3 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| action | what happens |
|---|---|
| push 3, 7, 12 | SP goes 0 -> 3 |
| pop | 12 |
| pop | 7 |
| pop | 3 |
| 16 pushes | SP wraps to 0 — no depth check |
| clocks | idle HIGH, count on release |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 1 | 74LS189 16x4 RAM |
| 1 | 74ls193 |
| 2 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, red |
| 8 | Resistor 10kΩ |
| 8 | Resistor 330Ω |

3 integrated circuit(s), 3 breadboard(s), 5 V.
