# A calculator with no computer in it

Set A on one switch bank and B on the other; the 74HC283 adds them and the CD4511 turns the 4-bit answer into a decimal digit on the display. There is no CPU, no firmware and nothing to program — the answer is the wiring. Sums of 10 to 15 blank the display: a BCD decoder only knows 0-9, and that honest limit is the reason real adders carry a "decimal adjust" stage.

**Teaches:** BCD decoding, driving a 7-segment display, the limits of 4 bits

## What to do

Set the DIP switches and watch the outputs. The build needs 3 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | display |
|---|---|---|
| 0 | 0 | 0 |
| 5 | 3 | 8 |
| 4 | 5 | 9 |
| 9 | 1 | blank (10) |
| 15 | 15 | blank, carry lit |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC283 4-bit Adder |
| 1 | CD4511 BCD-to-7-Segment Decoder |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, red |
| 8 | Resistor 10kΩ |
| 8 | Resistor 330Ω |
| 1 | 7-Segment Display |

2 integrated circuit(s), 3 breadboard(s), 5 V.
