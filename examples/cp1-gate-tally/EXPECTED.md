# Two-sensor direction tally

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xfe at `Request`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0xfd at `Second`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0xfd at `Request`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0xfd at `Second`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0xfd at `Request`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0xfe at `Second`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0xfd at `Request`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0xfe at `Second`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0xfd at `Request`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0xfe at `Second`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0xfb at `Request`.
- Expected PC `45`.
- Expected accumulator `00.000`.
- Expected `Tally` = 00.000.
- ANZ values: 00.002, 00.001, 00.000, 00.000.
