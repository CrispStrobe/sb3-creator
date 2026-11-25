# Escape the nine-cell grid

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x04 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x03 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x05 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x08 at `Request`.
- Expected PC `51`.
- Expected accumulator `00.008`.
- Expected `Position` = 00.008.
- ANZ values: 00.001, 00.002, 00.005, 00.008.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x03 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x06 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x07 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x08 at `Request`.
- Expected PC `51`.
- Expected accumulator `00.008`.
- Expected `Position` = 00.008.
- ANZ values: 00.003, 00.006, 00.007, 00.008.
