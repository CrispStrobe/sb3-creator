# Memory — sixteen places to put a number

The counter from C1 now drives the ADDRESS pins of a 74LS189, a 16-by-4-bit RAM. Yellow LEDs show which address the machine is looking at; green ones show what is stored there. Set the data switches, pulse WRITE, then clock to the next address and do it again — you are loading a program by hand, which is exactly how the first machines were programmed. WATCH OUT: the 74LS189 has INVERTED outputs. Store 5 and the LEDs read 10. That is the real chip, not a mistake, and it is why SAP-1 builds put a hex inverter after the RAM.

**Teaches:** address vs data, hand-loading a program, the 74LS189 inverted outputs

## What to do

Set the DIP switches and watch the outputs. The build needs 3 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| action | what you see |
|---|---|
| store 5 | LEDs read 10 (inverted!) |
| store 0 | LEDs read 15 |
| clock | address advances |

## What to buy

| qty | part |
|---|---|
| 1 | 74LS161 4-bit Counter |
| 1 | 74LS189 16x4 RAM |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, yellow |
| 6 | Resistor 10kΩ |
| 8 | Resistor 330Ω |

2 integrated circuit(s), 3 breadboard(s), 5 V.
