# Studio call lamps

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x00 at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.001`.
- P2 latch = 0x01.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x01 at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.004`.
- P2 latch = 0x04.

### 3. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x02 at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.016`.
- P2 latch = 0x10.

### 4. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x03 at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.064`.
- P2 latch = 0x40.

### 5. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x09 at `Entry`.
- Expected PC `10`.
- Expected accumulator `00.000`.
- P2 latch = 0x00.
