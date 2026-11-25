---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Twin counters

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Ground P1.2 to freeze the first cyclic counter, release it, then ground P1.5 to freeze the second. Both count modulo five with a 45-unit pause. P2.5 goes high only when the final samples agree.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
