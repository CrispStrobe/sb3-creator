---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Five-sample edge capture

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Supply digital samples on P1 at about 56 ms intervals. Bit P1.8 is the trigger. Keep it low for at least two samples, then raise it. Inspect BeforeA, BeforeB, Trigger, AfterA, and AfterB in order. The full pin bytes, including the trigger bit, are recorded. P2.1 marks capture.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
