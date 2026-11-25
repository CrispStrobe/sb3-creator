---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Calibrated bench readout

Import the monitor ROM, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Set an unsigned ADC sample on P1. Codes at or below 12 read zero; above 12, four codes equal a tenth of a volt. The program subtracts the offset and divides by four, leaving tenths of a volt in Reading.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.
