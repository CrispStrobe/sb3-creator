# Two-relay route puzzle

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xfc at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.000`.
- P2 latch = 0xf8.
- ANZ values: 00.000.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xfd at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.000`.
- P2 latch = 0xf9.
- ANZ values: 00.000.

### 3. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xfe at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.001`.
- P2 latch = 0xfe.
- ANZ values: 00.001.

### 4. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.000`.
- P2 latch = 0xfb.
- ANZ values: 00.000.
