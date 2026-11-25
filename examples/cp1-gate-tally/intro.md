---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Two-sensor direction tally

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Use active-low sensors A on P1.1 and B on P1.2, releasing each after activation. A then B increases the count, B then A decreases it, and two identical events are ignored. The tally is limited to 0–4 and starts at one. P1.3 alone low ends the run.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
