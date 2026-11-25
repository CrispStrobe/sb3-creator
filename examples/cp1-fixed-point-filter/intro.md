---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Quarter-step fixed-point filter

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Feed four unsigned samples to P1. A value from 0 to 63 represents quarter-units, and larger values are clipped to 63. The running result is floor((3 × previous + input) / 4), initialized at zero. Compare the P2 output of an impulse with that of a step input. The program emits four values with a 150-unit pause per sample.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
