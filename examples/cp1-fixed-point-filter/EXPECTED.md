# Quarter-step fixed-point filter

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x38 at `Read`.
- Set P1 to 0x00 at `Read`.
- Set P1 to 0x00 at `Read`.
- Set P1 to 0x00 at `Read`.
- Expected PC `36`.
- Expected accumulator `00.005`.
- Expected `Filtered` = 00.005.
- Expected `Count` = 00.004.
- P2 latch = 0x05.
- ANZ values: 00.014, 00.010, 00.007, 00.005.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x28 at `Read`.
- Set P1 to 0x28 at `Read`.
- Set P1 to 0x28 at `Read`.
- Set P1 to 0x28 at `Read`.
- Expected PC `36`.
- Expected accumulator `00.026`.
- Expected `Filtered` = 00.026.
- Expected `Count` = 00.004.
- P2 latch = 0x1a.
- ANZ values: 00.010, 00.017, 00.022, 00.026.

### 3. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Read`.
- Set P1 to 0x00 at `Read`.
- Set P1 to 0x00 at `Read`.
- Set P1 to 0x00 at `Read`.
- Expected PC `36`.
- Expected accumulator `00.006`.
- Expected `Filtered` = 00.006.
- Expected `Count` = 00.004.
- P2 latch = 0x06.
- ANZ values: 00.015, 00.011, 00.008, 00.006.
