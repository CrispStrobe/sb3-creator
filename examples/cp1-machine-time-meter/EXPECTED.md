# Usage total meter

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x00 at `Request`.
- Expected PC `29`.
- Expected accumulator `00.047`.
- Expected `Used` = 00.005.
- Expected `Cost` = 00.047.
- ANZ values: 00.007, 00.018, 00.025, 00.036, 00.047.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Expected PC `29`.
- Expected accumulator `00.088`.
- Expected `Used` = 00.008.
- Expected `Cost` = 00.088.
- ANZ values: 00.011, 00.022, 00.033, 00.044, 00.055, 00.066, 00.077, 00.088.
