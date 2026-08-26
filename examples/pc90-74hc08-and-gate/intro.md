# AND gate on a breadboard (74HC08)

Two DIP switches into one 74HC08 AND gate, one LED on the output. The LED lights only when BOTH switches are closed — the truth table, in your hand. Note the 10k pull-downs: an open switch must be pulled to a real LOW, or a CMOS input just floats.

**Teaches:** AND truth table, pull-down resistors, IC power pins

## What to do

Set the DIP switches and watch the outputs. Everything sits on one breadboard.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | LED |
|---|---|---|
| 0 | 0 | off |
| 1 | 0 | off |
| 0 | 1 | off |
| 1 | 1 | ON |
