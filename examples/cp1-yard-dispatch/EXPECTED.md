# Model yard route setter

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x00 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x03 at `Request`.
- Expected PC `30`.
- Expected accumulator `00.003`.
- P2 latch = 0xf9.
