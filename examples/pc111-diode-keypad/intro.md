# A decimal keypad made of diodes

Ten keys, four wires, fifteen diodes, no chip. Each key is diode-OR-ed onto the bit lines its number names — press 5 and it drives the ones line and the fours line, because 5 is 0101. This is what turns a binary machine into one you can type decimal into. Two things to notice, both real. A lit line reads about 4.3 V rather than 5, because every signal here passes through a diode and a diode costs you 0.7 V — you are seeing the forward drop in the LEDs. And pressing two keys at once gives you the OR of their codes rather than either number: 1 and 2 together read as 3. A diode matrix has no opinion about which key came first, which is exactly why real keypads put a PRIORITY encoder after one. Key 0 has no diodes at all, so "zero pressed" and "nothing pressed" look identical — the reason real encoders also carry a separate "a key is down" line.

**Teaches:** diode-OR encoding, the forward drop, why priority encoders exist

## What to do

Set the DIP switches and watch the outputs. The build needs 3 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| key | bit lines |
|---|---|
| 1 | 0001 |
| 5 | 0101 |
| 9 | 1001 |
| 1 and 2 together | 0011 — a digit nobody pressed |
| 0 / nothing | both 0000 |

## What to buy

| qty | part |
|---|---|
| 15 | Diode |
| 2 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 3 | LED 2V, green |
| 1 | LED 2V, red |
| 4 | Resistor 10kΩ |
| 4 | Resistor 330Ω |

0 integrated circuit(s), 3 breadboard(s), 5 V.
