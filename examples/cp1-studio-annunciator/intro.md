---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Studio call lamps

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Choose station 0–3 on P1. Its lamp is selected through a mask table on P2 terminals 1, 3, 5, or 7. Any other input clears all lamps.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
