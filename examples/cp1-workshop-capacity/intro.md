---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Workshop capacity

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

A full P1 byte of 1 means arrival and 2 means departure. Return P1 to 255 after each event. Code 0 ends the session. There are three free places initially; arrivals at zero and departures at three are ignored.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
