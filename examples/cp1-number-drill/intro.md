---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Three quick sums

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Each round displays two addends, followed by a wait for an answer on P1. Use 255 while no answer is selected and between rounds. P2.1 shows whether the answer is correct. The final panel value is the score out of three.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
