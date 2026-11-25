---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Find the cabinet code

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Guess a byte from 0 to 254 on P1. Return to 255 between guesses. P2 gives 1 for low, 2 for high, 3 for correct, or 4 after twelve unsuccessful guesses. Attempts counts the guesses.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
