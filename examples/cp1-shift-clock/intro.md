---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Shift change clock

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Start at 23:58. A low pulse on P1.1 advances a minute; release between pulses. P2 is the hour and the panel shows minutes. Ground P1.2 alone to finish. Three pulses cross midnight and end at 00:01.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
