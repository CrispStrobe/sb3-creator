---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Four samples to cassette

Choose **Use Brickwright monitor**, run until ready, and pause the CPU. Load the cells, resume without resetting, and enter `000 PC RUN`.

Install CP3 and connect CP2 on P1.7 and P1.8. Use P3.8 as an active-low sample button and P3.1–P3.6 for sample values. Keep P3.7 low and release the button between samples. After four samples, inspect RecordA through RecordD and Total in upper RAM. Press CAS to save all installed RAM. After startup clears RAM, use CAL with the saved stream to recover the four samples and their total, then verify by OUT. CAS and CAL are monitor actions after the teaching program halts.

Use **Instruments → Switches** for the inputs. Open means high and closed means low. Switch identifiers use the connector’s zero-based bit numbers. Terminal 1 is bit 0.

This circuit includes CP3.
