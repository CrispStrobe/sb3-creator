# The program counter — where the machine is looking

A 74LS161 counting 0 to 15 in binary, one step per clock. This is the register that says which instruction comes next; a program is just this number walking upward. The red LED is the ripple carry, which lights on 15 and is how counters are chained into wider ones. Clear and load are ACTIVE LOW, so they are tied high to leave the counter free-running.

**Teaches:** binary counting, active-low control pins, ripple carry

## What to do

Set the DIP switches and watch the outputs. The build needs 2 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| clocks | LEDs |
|---|---|
| 0 | 0000 |
| 1 | 0001 |
| 9 | 1001 |
| 15 | 1111 + RCO lit |
| 16 | wraps to 0000 |
