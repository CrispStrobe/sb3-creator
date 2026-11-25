---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Descent on three charges

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Send P1 byte 0 to coast or 1 to brake, returning to 255 after each command. Start at height 15, speed 2, and three brake charges. Coasting increases speed; a charge decreases it to a minimum of one. A touchdown at speed one or two reports 1, otherwise 2.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
