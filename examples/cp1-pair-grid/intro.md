---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Six-card memory grid

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Choose card indices 0–5 on P1, returning to 255 between choices. The panel reveals each chosen value; P2.1 reports whether two different cards matched. A matched pair is removed. Find all three pairs to halt.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
