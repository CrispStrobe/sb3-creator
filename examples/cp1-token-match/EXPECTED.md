# Ten-token match

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x04 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x03 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Expected PC `40`.
- Expected accumulator `00.001`.
- Expected `Left` = 00.000.
- Expected `Result` = 00.001.
- ANZ values: 00.006, 00.002, 00.001.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x03 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Expected PC `40`.
- Expected accumulator `00.002`.
- Expected `Left` = 00.000.
- Expected `Result` = 00.002.
- ANZ values: 00.006, 00.002, 00.002.
