---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Tile bundle counter

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Run to count seven bundles of thirteen tiles. Inspect Product and Remaining after halt, and single-step a loop to see that each pass adds one bundle.
