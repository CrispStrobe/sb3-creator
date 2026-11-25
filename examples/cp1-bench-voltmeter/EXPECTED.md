# Calibrated bench readout

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x08 at `Sample`.
- Expected PC `19`.
- Expected accumulator `00.000`.
- Expected `Reading` = 00.000.
- ANZ values: 00.000.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x36 at `Sample`.
- Expected PC `19`.
- Expected accumulator `00.010`.
- Expected `Reading` = 00.010.
- ANZ values: 00.010.

### 3. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xd4 at `Sample`.
- Expected PC `19`.
- Expected accumulator `00.050`.
- Expected `Reading` = 00.050.
- ANZ values: 00.050.
