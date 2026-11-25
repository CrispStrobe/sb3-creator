# Sink and sample

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xfd at `Probe`.
- Expected PC `9`.
- Expected accumulator `00.000`.
- Expected `Sample` = 00.000.
- P1 latch = 0xff.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Probe`.
- Expected PC `9`.
- Expected accumulator `00.001`.
- Expected `Sample` = 00.001.
- P1 latch = 0xff.
