---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Three display captions

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Run and read 026, 148 and 073 in order. Each remains visible for its different programmed pause. HLT returns to the PC frame; ACC still shows 073.
