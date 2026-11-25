---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Reaction signal

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Choose the short cue wait by grounding P1.3 or the long wait by leaving it open. Keep P1.4 open until P2.6 goes high and then press the response button. The counter records completed 35-unit intervals after the cue, up to twelve.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
