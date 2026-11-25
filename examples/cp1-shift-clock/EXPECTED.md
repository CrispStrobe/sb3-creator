# Shift change clock

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xfe at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xfe at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xfe at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xfd at `Request`.
- Expected PC `36`.
- Expected accumulator `00.001`.
- Expected `Hour` = 00.000.
- Expected `Minute` = 00.001.
- P2 latch = 0x00.
- ANZ values: 00.059, 00.000, 00.001.
