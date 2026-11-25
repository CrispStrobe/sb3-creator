# Acknowledged serial transmitter

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Preset `Payload` to 00.173.
- Expected PC `44`.
- Expected accumulator `00.173`.
- Expected `Payload` = 00.173.
- Expected `Parity` = 00.001.
- P2 latch = 0xff.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Preset `Payload` to 00.000.
- Expected PC `44`.
- Expected accumulator `00.000`.
- Expected `Payload` = 00.000.
- Expected `Parity` = 00.000.
- P2 latch = 0xfe.

### 3. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Set P1 to 0xfb at `WaitAckLow`.
- Set P1 to 0xfb at `WaitAckHigh`.
- Set P1 to 0xff at `WaitAckHigh`.
- Preset `Payload` to 00.255.
- Expected PC `44`.
- Expected accumulator `00.255`.
- Expected `Payload` = 00.255.
- Expected `Parity` = 00.000.
- P2 latch = 0xfe.
