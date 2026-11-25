---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Conveyor changeover

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Use a motor model with enable on P2.1 and reverse on P2.2. P1 commands are 0 stop, 1 forward, 2 reverse and 3 stop and halt. Return to 255 between commands. The program disables the motor before changing direction and waits 40 units before enabling again.

This bench uses LEDs for enable and reverse. Watch the enable LED during the changeover.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
