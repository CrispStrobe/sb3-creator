# Find the cabinet code

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x38 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x80 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x66 at `Request`.
- Expected PC `30`.
- Expected accumulator `00.003`.
- Expected `Attempts` = 00.003.
- P2 latch = 0x03.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x65 at `Request`.
- Expected PC `30`.
- Expected accumulator `00.004`.
- Expected `Attempts` = 00.012.
- P2 latch = 0x04.
