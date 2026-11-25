# Reaction signal

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xfb at `Select`.
- Set P1 to 0xfb at `ReadButton`.
- Set P1 to 0xfb at `ReadButton`.
- Set P1 to 0xf3 at `ReadButton`.
- Expected PC `26`.
- Expected accumulator `00.002`.
- Expected `Count` = 00.002.
- P2 latch = 0xdf.
- ANZ values: 00.002.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Select`.
- Set P1 to 0xf7 at `ReadButton`.
- Expected PC `26`.
- Expected accumulator `00.000`.
- Expected `Count` = 00.000.
- P2 latch = 0xdf.
- ANZ values: 00.000.
