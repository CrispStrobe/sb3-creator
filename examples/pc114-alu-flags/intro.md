# Eight bits, and flags the machine works out for itself

C12 took its flags from two switches. This is where they actually come from. Two 74HC283s chained carry-to-carry make an eight-bit adder — widening is mechanical, and that is worth seeing once. The flags are not. CARRY is the top adder's cout, one wire that was already there. ZERO needs every one of eight sum bits to be low, and nobody sells an 8-input NOR, so a 74HC688 magnitude comparator has its Q side tied to ground: it asserts P=Q exactly when the sum is zero. Set the mode switch and the XOR bank inverts B while a 1 enters at the bottom — two's complement, so the same hardware subtracts, and the carry lamp now means "no borrow".

**Teaches:** widening is mechanical; a zero flag is a comparator you can buy, an 8-input NOR is not

## What to do

Set the DIP switches and watch the outputs. The build needs 5 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| input | result |
|---|---|
| 200 + 100 | sum 44, carry |
| 255 + 1 | sum 0, carry AND zero |
| 0 - 1 | sum 255, carry clear = borrow |
| 5 - 5 | sum 0, zero, no borrow |
| zero detect | 74HC688 with Q tied low |
| adder | two 74HC283, carry chained |

## What to buy

| qty | part |
|---|---|
| 2 | 74HC283 4-bit Adder |
| 1 | 74hc688 |
| 2 | 74HC86 Quad XOR |
| 5 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 8 | LED 2V, yellow |
| 17 | Resistor 10kΩ |
| 10 | Resistor 330Ω |

5 integrated circuit(s), 5 breadboard(s), 5 V.
