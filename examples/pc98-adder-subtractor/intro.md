# Subtraction is the same circuit

One extra 74HC86 turns the adder into an adder-subtractor. The mode switch feeds the XOR bank AND the carry-in at once: with it open you get A + B, with it closed every B bit flips and a 1 enters the bottom, which is two’s complement — so the machine subtracts without a single new adder. The red LED now means "no borrow": it lights when A is greater than or equal to B.

**Teaches:** two's complement, XOR as a controlled inverter, the borrow flag

## What to do

Set the DIP switches and watch the outputs. The build needs 3 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| mode | A | B | result |
|---|---|---|---|
| + | 7 | 2 | 9 |
| − | 7 | 2 | 5, carry lit (no borrow) |
| − | 2 | 7 | 11, carry dark (borrowed) |
| + | 15 | 1 | 0, carry lit |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC283 4-bit Adder |
| 1 | 74HC86 Quad XOR |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 9 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

2 integrated circuit(s), 3 breadboard(s), 5 V.
