# The half adder (XOR + AND)

One XOR and one AND, and the machine can add one bit to one bit. SUM is the XOR (1+0 = 1, and 1+1 = 0 because it carried), CARRY is the AND. Set both switches: SUM goes dark and CARRY lights — that is binary 1+1 = 10, read across two LEDs. It is called HALF because it has nowhere to put a carry coming IN.

**Teaches:** binary addition of one bit, sum and carry

## What to do

Set the DIP switches and watch the outputs. Everything sits on one breadboard.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | SUM | CARRY |
|---|---|---|---|
| 0 | 0 | off | off |
| 1 | 0 | ON | off |
| 0 | 1 | ON | off |
| 1 | 1 | off | ON |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC08 Quad AND |
| 1 | 74HC86 Quad XOR |
| 1 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 2 | Resistor 10kΩ |
| 2 | Resistor 330Ω |

2 integrated circuit(s), 1 breadboard(s), 5 V.
