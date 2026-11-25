# Acknowledged serial receiver

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Expected PC `47`.
- Expected accumulator `00.173`.
- Expected `Received` = 00.173.
- Expected `Valid` = 00.001.
- Expected `Parity` = 00.000.
- P2 latch = 0xff.
- ANZ values: 00.173.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Expected PC `47`.
- Expected accumulator `00.255`.
- Expected `Received` = 00.255.
- Expected `Valid` = 00.001.
- Expected `Parity` = 00.000.
- P2 latch = 0xff.
- ANZ values: 00.255.

### 3. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Set P1 to 0xfd at `WaitStrobeLow`.
- Set P1 to 0xfd at `WaitStrobeHigh`.
- Set P1 to 0xff at `WaitStrobeHigh`.
- Set P1 to 0xfc at `WaitStrobeLow`.
- Set P1 to 0xfc at `WaitStrobeHigh`.
- Set P1 to 0xfe at `WaitStrobeHigh`.
- Expected PC `47`.
- Expected accumulator `00.000`.
- Expected `Received` = 00.173.
- Expected `Valid` = 00.000.
- Expected `Parity` = 00.001.
- P2 latch = 0xff.
- ANZ values: 00.000.
