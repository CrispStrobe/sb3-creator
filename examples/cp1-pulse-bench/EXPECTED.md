# Five-pulse counter

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Arm`.
- Set P1 to 0xef at `Fall`.
- Set P1 to 0xef at `Release`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xef at `Fall`.
- Set P1 to 0xef at `Release`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xef at `Fall`.
- Set P1 to 0xef at `Release`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xef at `Fall`.
- Set P1 to 0xef at `Release`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xef at `Fall`.
- Set P1 to 0xef at `Release`.
- Set P1 to 0xff at `Release`.
- Expected PC `22`.
- Expected accumulator `00.005`.
- Expected `Pulses` = 00.005.
- ANZ values: 00.001, 00.002, 00.003, 00.004, 00.005.
