# The ring counter — six beats to every instruction

A SAP-1 does not do an instruction in one go: it takes six timing states, T1 to T6, and exactly one is active at any moment. T1-T3 are the same for every instruction (fetch: put the address out, read memory, advance the counter); T4-T6 are what makes LDA different from ADD. A CD4017 is one-hot by construction, and wiring its seventh output back to its own RESET makes it wrap after six — a six-state ring counter from one chip and one wire.

**Teaches:** one-hot counting, timing states, self-resetting a counter

## What to do

Set the DIP switches and watch the outputs. The build needs 2 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| clocks | active state |
|---|---|
| 0 | T1 |
| 1 | T2 |
| 5 | T6 |
| 6 | T1 again |

## What to buy

| qty | part |
|---|---|
| 1 | CD4017 Decade Counter |
| 1 | 4-way DIP Switch (SPST) |
| 5 | LED 2V, green |
| 1 | LED 2V, yellow |
| 1 | Resistor 10kΩ |
| 6 | Resistor 330Ω |

1 integrated circuit(s), 2 breadboard(s), 5 V.
