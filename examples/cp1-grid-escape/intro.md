---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Escape the nine-cell grid

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

The cells are numbered 0–8 row by row. Start at 0, select a destination on P1, then return to 255. Only horizontal or vertical neighbors are legal, and cell 4 is blocked. Reach cell 8 and use the panel to follow legal moves.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
