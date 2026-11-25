---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Sequence cabinet

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

P1 carries a key code and 255 means released. Enter 9, 4, 7 in order to open the model cabinet at P2.3. A wrong key resets the sequence to its first position. The display shows the number of correct consecutive keys.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
