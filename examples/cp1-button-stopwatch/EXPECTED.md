# Button stopwatch

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xf7 at `Gate`.
- Set P1 to 0xf7 at `Gate`.
- Set P1 to 0xf7 at `Gate`.
- Set P1 to 0xff at `Gate`.
- Expected PC `15`.
- Expected accumulator `00.003`.
- Expected `Count` = 00.003.
- ANZ values: 00.001, 00.002, 00.003.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xf7 at `Gate`.
- Expected PC `15`.
- Expected accumulator `00.009`.
- Expected `Count` = 00.009.
- ANZ values: 00.001, 00.002, 00.003, 00.004, 00.005, 00.006, 00.007, 00.008, 00.009.
