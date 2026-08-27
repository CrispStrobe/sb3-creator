# CALL and RET — the microcode moves the pointer

C14 worked the stack by hand. Here the control store does it: two more output bits, Spd and Spu, and CALL and RET are just rows of bytes like every other instruction. Set the opcode to 0101 and clock through — the stack slot is addressed, the return address goes on the bus, and on the last step the pointer moves and the machine jumps. 0110 is the same thing backwards, and the pointer moves FIRST because the slot you want is below where it is resting. Watch the inverter: a control line idles LOW and the 74LS193's clocks idle HIGH, so without it both clocks would sit low and the pointer would never move at all — which is C14's lesson arriving as a property of the microcode's timing instead of a finger on a button.

**Teaches:** a subroutine call as rows of bytes; why CALL stores then moves and RET moves then reads

## What to do

Set the DIP switches and watch the outputs. The build needs 6 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| step | control word |
|---|---|
| CALL T4 | Esp + Lm — address the slot |
| CALL T5 | Ep — return address on the bus |
| CALL T6 | Spd + Ei + Lp — move and jump |
| RET T4 | Spu — move FIRST |
| RET T5 | Esp + Lm |
| RET T6 | CE + Lp — read it back |

## What to buy

| qty | part |
|---|---|
| 1 | 28c256 readOnly=true, contents=0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,0,0,16,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,128,0,48,0,0,0,0,0,64,128,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0 |
| 1 | 28c256 readOnly=true, contents=3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,32,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,0,0,0,0,0,3,4,24,32,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,34,72,0,0,0,3,4,24,34,136,64,0,0,3,4,24,34,136,64,0,0,3,4,24,32,0,0,0,0,3,4,24,32,0,0,0,0,3,4,24,2,1,32,0,0,3,4,24,0,2,8,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0,3,4,24,0,0,0,0,0 |
| 1 | 74HC00 Quad NAND |
| 1 | 74HC04 Hex NOT |
| 1 | 74LS161 4-bit Counter |
| 1 | 74ls193 |
| 3 | 4-way DIP Switch (SPST) |
| 8 | LED 2V, green |
| 10 | LED 2V, red |
| 5 | LED 2V, yellow |
| 8 | Resistor 10kΩ |
| 23 | Resistor 330Ω |

4 integrated circuit(s), 6 breadboard(s), 5 V.
