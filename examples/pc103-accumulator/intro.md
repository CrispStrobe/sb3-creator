# The accumulator — a circuit with a past

A 74LS173 register holds a running total; a 74HC283 adds the switch value to it; the sum goes straight back into the register. Every clock pulse adds again, so the display climbs by whatever you set on the switches — set 1 and it counts, set 3 and it goes 3, 6, 9. This is the first circuit here whose answer depends on what happened before, and that feedback loop — register out, through logic, back into register in — is the shape of every processor ever built. MR clears it back to zero.

**Teaches:** registers, feedback, state that survives between clocks

## What to do

Set the DIP switches and watch the outputs. The build needs 2 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| action | total |
|---|---|
| +3, clock 1 | 3 |
| clock 2 | 6 |
| clock 3 | 9 |
| no clock | unchanged |
| MR | 0 |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC283 4-bit Adder |
| 1 | 74LS173 4-bit Register |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 6 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

2 integrated circuit(s), 2 breadboard(s), 5 V.
