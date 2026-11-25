---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Two edge-triggered pulses

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Starting high, pull P1.6 low to start a 200-unit pulse on P2.4. Holding the input low cannot make a second pulse. Release and pull low again for the second pulse, then the program halts.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
