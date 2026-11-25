---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Two-byte tile total

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Count nine bundles of 73. The total is held in two numeric cells, High and Low, in base 256. Before an addition could overflow, replace it with the equivalent subtraction and increment High. The result is 2 × 256 + 145 = 657.
