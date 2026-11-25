# Expected results

| Phase | Teaching RAM | Port 4 byte | Green lamp | Red lamp |
| --- | --- | --- | --- | --- |
| First | Cell 128 contains 00.001 | 1 | On | Off |
| Second | Cell 255 contains 00.002 | 2 | Off | On |
| Second, after editing cell 255 | Cell 255 contains 00.003 | 3 | On | On |
| Dark | Immediate value 0 | 0 | Off | Off |

P4.0 and P4.1 drive the relay transistors. The normally open contacts switch the separate lamp battery. Each phase requests two 250 ms monitor delays.
