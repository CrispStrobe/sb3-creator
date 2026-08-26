# NAND is universal

NOT, AND and OR built from nothing but 74HC00 NAND gates. Tie a NAND's two inputs together and it inverts; invert a NAND and it ANDs; NAND two inverted inputs and De Morgan hands you OR. One gate type can build every other — which is why a chip fab only needs to be good at one thing.

**Teaches:** De Morgan, building any gate from one gate type

## What to do

Set the DIP switches and watch the outputs. Everything sits on one breadboard.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | NOT A | A AND B | A OR B |
|---|---|---|---|---|
| 0 | 0 | ON | off | off |
| 1 | 0 | off | off | ON |
| 0 | 1 | ON | off | ON |
| 1 | 1 | off | ON | ON |
