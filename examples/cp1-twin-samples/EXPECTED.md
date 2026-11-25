# Twin counters

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `First`.
- Set P1 to 0xff at `First`.
- Set P1 to 0xff at `First`.
- Set P1 to 0xfd at `First`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xff at `Second`.
- Set P1 to 0xff at `Second`.
- Set P1 to 0xff at `Second`.
- Set P1 to 0xef at `Second`.
- Expected PC `39`.
- Expected accumulator `00.001`.
- Expected `SampleA` = 00.003.
- Expected `SampleB` = 00.003.
- P2 latch = 0xff.
- ANZ values: 00.001.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `First`.
- Set P1 to 0xfd at `First`.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xff at `Second`.
- Set P1 to 0xff at `Second`.
- Set P1 to 0xff at `Second`.
- Set P1 to 0xef at `Second`.
- Expected PC `39`.
- Expected accumulator `00.000`.
- Expected `SampleA` = 00.001.
- Expected `SampleB` = 00.003.
- P2 latch = 0xef.
- ANZ values: 00.000.
