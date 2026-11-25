---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Two workbench entries

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Use entry 000 to update Stock to 047, then use entry 016 without reloading to calculate Stock plus five. Entering directly at 016 after loading uses the initial stock of 018.
