# Two edge-triggered pulses

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Arm`.
- Set P1 to 0xdf at `Fall`.
- Set P1 to 0xdf at `Arm`.
- Set P1 to 0xdf at `Arm`.
- Set P1 to 0xff at `Arm`.
- Set P1 to 0xdf at `Fall`.
- Expected PC `23`.
- Expected accumulator `00.002`.
- Expected `Count` = 00.002.
- P2 latch = 0xf7.
