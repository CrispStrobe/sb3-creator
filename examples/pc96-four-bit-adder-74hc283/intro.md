# 4-bit adder on one chip (74HC283)

Eight switches in, five LEDs out: a whole 4-bit adder in one 16-pin package. Inside it is four of the full adder you just built, chained carry to carry. Read A on the left bank, B on the right, and the answer across the LEDs (the red one is the carry, worth 16). Note the engine spells the bit slices a0..a3 — a0 is the ONES bit.

**Teaches:** binary place value, ripple carry, reading a bus

## What to do

Set the DIP switches and watch the outputs. The build needs 2 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | Cout + SUM |
|---|---|---|
| 0000 | 0000 | 0 0000 |
| 0101 | 0011 | 0 1000 |
| 1111 | 0001 | 1 0000 |
| 1111 | 1111 | 1 1110 |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC283 4-bit Adder |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 8 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

1 integrated circuit(s), 2 breadboard(s), 5 V.
