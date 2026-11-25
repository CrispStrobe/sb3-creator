# Five-sample edge capture

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xf6 at `First`.
- Set P1 to 0x09 at `First`.
- Set P1 to 0x16 at `Second`.
- Set P1 to 0x23 at `Read`.
- Set P1 to 0x2f at `Read`.
- Set P1 to 0xa5 at `Read`.
- Set P1 to 0xab at `PostA`.
- Set P1 to 0xba at `PostB`.
- Expected PC `30`.
- Expected accumulator `00.165`.
- Expected `BeforeA` = 00.035.
- Expected `BeforeB` = 00.047.
- Expected `Trigger` = 00.165.
- Expected `AfterA` = 00.171.
- Expected `AfterB` = 00.186.
- P2 latch = 0xff.
- ANZ values: 00.165.
