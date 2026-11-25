---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Six-lamp stop ring

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Set a stop index 0–5 on P1. The running lamp starts at index 4 and advances clockwise to the requested position. Other input bytes wait for a valid index. P2 bits 1–6 drive the ring.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
