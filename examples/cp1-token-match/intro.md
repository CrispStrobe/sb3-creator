---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Ten-token match

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Take 1, 2, or 3 tokens by sending that byte on P1. Return to 255 between moves. The computer tries to make each pair of turns remove four, but takes only what remains. Result 1 means the player took the last token and 2 means the computer did.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
