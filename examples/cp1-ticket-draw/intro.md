---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Ticket draw

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Connect a pushbutton from P1.3 to ground. Start with it open, run, and close it once to freeze and display a ticket from 1 through 11. The value advances by three between samples; timing chooses the ticket.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
