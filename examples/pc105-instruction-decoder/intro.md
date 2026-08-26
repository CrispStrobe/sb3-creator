# The instruction decoder — a number becomes a meaning

Four switches are the opcode; five LEDs are the instructions. 0000 is LDA, 0001 ADD, 0010 SUB, 1110 OUT, 1111 HLT. Two 74HC138 decoders split on the top bit — one is enabled while it is low, the other while it is high — which is what those three enable pins on a decoder are FOR. The outputs are ACTIVE LOW, so each LED is wired from +5 V down INTO the chip and lights when its line goes low. That is not a quirk to work around; it is how decoders and control lines really talk.

**Teaches:** decoders, enable pins, active-low outputs

## What to do

Set the DIP switches and watch the outputs. The build needs 2 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| opcode | decoded |
|---|---|
| 0000 | LDA |
| 0001 | ADD |
| 0010 | SUB |
| 1110 | OUT |
| 1111 | HLT |
| 0111 | nothing — not an instruction |
