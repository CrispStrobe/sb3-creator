---
level: intermediate
age: 11+
prereqs: [clock-ds3231, eeprom-start-counter]
teaches: [buses, loops, addresses]
---
## What you see
The serial monitor lists every chip that answers on the I2C bus — "device at 80" and "device at 104" — and then how many it found. The lamp lights when at least one answered.

## Try this
1. Which chip is at 80 and which at 104? (Hint: look at the other two examples.) Those numbers are usually written in hexadecimal: 0x50 and 0x68.
2. Remove the clock from the program (delete its PART line). What does the scanner find now?
3. Make the lamp blink once per device found.

## What is going on
Every chip on an I2C bus answers to its own 7-bit address, a number from 1 to 127. To talk to one, the program starts a transfer and sends the address; the chip with that address answers by pulling the data wire low for one clock pulse — the "acknowledge". If nobody pulls, the wire stays high and nobody is home.

`i2c device a on bus` does exactly that for address `a`, and the REPEAT tries all 127. The `PART bus = I2C …` line only names the two wires; the clock and the memory chip are connected to the same two.

## Why it matters
When a new sensor does not work, the first question is "is it even there?" A scanner like this is the first tool people reach for — and the address plan of a bus is what lets dozens of chips share two wires.

## Go further
- [clock-ds3231](../clock-ds3231) — the chip at 104.
- [eeprom-start-counter](../eeprom-start-counter) — the chip at 80.
- Experiment: print the addresses in hexadecimal.
