# Workshop capacity

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x01 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x02 at `Request`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0x00 at `Request`.
- Expected PC `29`.
- Expected accumulator `00.003`.
- Expected `Free` = 00.003.
- ANZ values: 00.002, 00.001, 00.000, 00.000, 00.001, 00.002, 00.003, 00.003.
