---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Two-relay route puzzle

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Choose route switches on P1.1 and P1.2. P2.1 and P2.2 echo the two chosen branches. P2.3 lights only for the route that uses the right branch but leaves the left branch open. Predict and test all four settings.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
