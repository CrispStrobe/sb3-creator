# Signal sequence memory

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Wait`.
- Set P1 to 0xfd at `Wait`.
- Expected PC `35`.
- Expected accumulator `00.004`.
- Expected `Memory` = 00.002.
- Expected `Second` = 00.005.
- Expected `Third` = 00.001.
- Expected `Fourth` = 00.004.
- P2 latch = 0x04.
