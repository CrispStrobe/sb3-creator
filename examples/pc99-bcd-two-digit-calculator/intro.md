# Two digits: the calculator that does not give up at nine

L7 blanked above 9 because a BCD decoder only knows ten digits. This is the real fix, and it is what every decimal adder does: if the sum leaves the decimal range, ADD SIX to it and carry a ten. Three gates spot the overflow (Cout, or S3 with S2, or S3 with S1), a second 74HC283 adds the six, and that same carry lights the tens digit. Set each bank to a decimal digit 0-9 and read the answer, 0 to 18.

**Teaches:** BCD correction (add six), decimal carry, driving two displays

## What to do

Set the DIP switches and watch the outputs. The build needs 4 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | display |
|---|---|---|
| 3 | 4 | 07 |
| 9 | 0 | 09 |
| 9 | 1 | 10 |
| 7 | 6 | 13 |
| 9 | 9 | 18 |
