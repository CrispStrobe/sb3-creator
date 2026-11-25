---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Sink and sample

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Observe P1.5 with a high-impedance probe. It is pulled low, P1.2 is sampled while the line is low, and P1.5 is released after 145 delay units. A contact on P1.2 gives 000 when grounded and 001 when open.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
