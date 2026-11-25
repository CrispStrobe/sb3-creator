---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Acknowledged serial transmitter

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Start serial-receive on the other board first. Connect sender P2.1 to receiver P1.1 (data), sender P2.2 to receiver P1.2 (active-low strobe), receiver P2.3 to sender P1.3 (active-low acknowledgment), and join the grounds. The sender sends Payload MSB first plus even parity. It holds each bit until the receiver acknowledges it and waits for the acknowledgment to be released before changing data. Stop either board with STP if the peer is absent.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
