---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Usage total meter

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

On P1, send 1 for a base-rate tick (7 credits), 2 for a peak-rate tick (11 credits), and 255 between ticks. Send 0 to finish early. Eight accepted ticks also end the session. Inspect Used and Cost.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
