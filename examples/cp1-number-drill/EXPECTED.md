# Three quick sums

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x07 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x0b at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x11 at `Request`.
- Expected PC `46`.
- Expected accumulator `00.002`.
- Expected `Score` = 00.002.
- Expected `Round` = 00.003.
- P2 latch = 0xff.
- ANZ values: 00.005, 00.002, 00.007, 00.005, 00.009, 00.008, 00.002.
