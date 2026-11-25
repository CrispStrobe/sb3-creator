# Six-card memory grid

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x00 at `FirstRead`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0x01 at `SecondRead`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0x00 at `FirstRead`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0x02 at `SecondRead`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0x01 at `FirstRead`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0x04 at `SecondRead`.
- Set P1 to 0xff at `ReleaseRound`.
- Set P1 to 0x03 at `FirstRead`.
- Set P1 to 0xff at `ReleaseFirst`.
- Set P1 to 0x05 at `SecondRead`.
- Expected PC `47`.
- Expected accumulator `00.003`.
- Expected `Pairs` = 00.003.
- Expected `CardA` = 00.000.
- Expected `CardB` = 00.000.
- Expected `CardC` = 00.000.
- Expected `CardD` = 00.000.
- Expected `CardE` = 00.000.
- Expected `CardF` = 00.000.
- P2 latch = 0xff.
- ANZ values: 00.021, 00.083, 00.021, 00.021, 00.083, 00.083, 00.047, 00.047.
