# Sequence cabinet

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x09 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x07 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x09 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x04 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x07 at `Request`.
- Expected PC `36`.
- Expected accumulator `00.003`.
- Expected `Progress` = 00.003.
- P2 latch = 0xff.
- ANZ values: 00.001, 00.000, 00.001, 00.002, 00.003.
