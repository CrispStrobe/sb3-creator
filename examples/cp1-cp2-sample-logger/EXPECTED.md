# Four samples to cassette

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P3 to 0x06 at `Wait`.
- Set P3 to 0x86 at `Release`.
- Set P3 to 0x27 at `Wait`.
- Set P3 to 0xa7 at `Release`.
- Set P3 to 0x0c at `Wait`.
- Set P3 to 0x8c at `Release`.
- Set P3 to 0x37 at `Wait`.
- Expected PC `26`.
- Expected accumulator `00.112`.
- Expected `RecordA` = 00.006.
- Expected `RecordB` = 00.039.
- Expected `RecordC` = 00.012.
- Expected `RecordD` = 00.055.
- Expected `Total` = 00.112.
- ANZ values: 00.112.
