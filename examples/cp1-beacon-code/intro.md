---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Short–long beacon

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Probe P2.2. Four pulses encode short, long, long, short from a symbol table. The initial quiet interval, each short pulse, and each off gap are 70 units, and each long pulse is 210 units. The output remains off at halt.
