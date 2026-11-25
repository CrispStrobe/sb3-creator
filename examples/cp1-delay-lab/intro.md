---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Nested timing lab

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Probe P2.4. Measure the low pulse across four outer iterations of six inner iterations. This delay uses only teaching instructions. Visits should read 024 after halt.
