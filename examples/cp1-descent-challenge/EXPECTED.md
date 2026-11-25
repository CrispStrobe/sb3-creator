# Descent on three charges

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x00 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x00 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x00 at `Request`.
- Expected PC `38`.
- Expected accumulator `00.001`.
- Expected `Height` = 00.000.
- Expected `Speed` = 00.002.
- Expected `Fuel` = 00.000.
- Expected `Result` = 00.001.
- ANZ values: 00.012, 00.008, 00.005, 00.003, 00.002, 00.001.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x00 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x00 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x00 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x00 at `Request`.
- Expected PC `38`.
- Expected accumulator `00.002`.
- Expected `Height` = 00.000.
- Expected `Speed` = 00.006.
- Expected `Fuel` = 00.003.
- Expected `Result` = 00.002.
- ANZ values: 00.012, 00.008, 00.003, 00.002.
