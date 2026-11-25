---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Batch ticker

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Run to display batch IDs 31, 34, and 37 at regular intervals. The branch returns the value to 31 and continues until STP.
