# Six-lamp stop ring

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Select`.
- Set P1 to 0x03 at `Select`.
- Expected PC `22`.
- Expected accumulator `00.003`.
- Expected `Index` = 00.003.
- P2 latch = 0x08.

### 2. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0x04 at `Select`.
- Expected PC `22`.
- Expected accumulator `00.004`.
- Expected `Index` = 00.004.
- P2 latch = 0x10.
