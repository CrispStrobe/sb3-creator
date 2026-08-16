---
level: intermediate
age: 10+
prereqs: [arduino-05-if-statement]
teaches: [switch-case, range-mapping, ldr]
---
## What you see
An LDR (light sensor) reading is divided into four named ranges — dark, dim, medium, bright — and the serial monitor prints which range the current light level falls in.

## Try this
1. Run the program and change the LDR stimulus to see different range names appear.
2. Change the divisor from 3 to 5 to create more ranges.
3. Add an LED that turns on only in the dark range — a night light.

## What is going on
The analog reading (0-1023) is scaled to a small integer by dividing by 1024 and multiplying by the number of ranges. Each value maps to one IF block that prints the range name. This is the blocks equivalent of a C switch statement.

## Go further
- [arduino-05-if-statement](../arduino-05-if-statement) — a single threshold with one LED.
- [arduino-05-switch-case-2](../arduino-05-switch-case-2) — switching on input to select LED patterns.
