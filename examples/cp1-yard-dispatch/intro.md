---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Model yard route setter

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

P1 codes 0 and 1 request route A or B, 2 sets both signals to stop, and 3 stops and halts. Return to 255 between commands. P2.1 selects the turnout; P2.2 and P2.3 are route-clear outputs. Both signals stop before the turnout moves, and a 120-unit settling delay precedes opening one route.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
