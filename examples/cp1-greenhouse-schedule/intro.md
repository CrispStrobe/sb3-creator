---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Greenhouse vent schedule

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Use active-low pulses on P1.1 as simulated minutes. P2.7 opens the vent at minutes 2 and 6 and closes it at 4 and 8. The schedule ends after minute 9. Each low pulse needs a high release before the next.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
