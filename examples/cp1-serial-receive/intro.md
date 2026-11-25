---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Acknowledged serial receiver

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Use the three signal connections in serial-transmit. Run this board first. It samples the data while strobe is low, acknowledges each bit on P2.3 and releases that line after strobe goes high. After eight data bits and one even-parity bit, Valid is 1 for acceptance or 0 for a parity fault. The display gives the accepted byte or zero. Parity detects an odd number of altered bits.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
