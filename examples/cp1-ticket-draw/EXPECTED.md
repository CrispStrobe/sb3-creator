# Ticket draw

Independently authored teaching program and observations.

### 1. Verification

Start at `Entry` and run to HLT.
- Set P1 to 0xff at `Release`.
- Set P1 to 0xff at `ReadButton`.
- Set P1 to 0xff at `ReadButton`.
- Set P1 to 0xff at `ReadButton`.
- Set P1 to 0xff at `ReadButton`.
- Set P1 to 0xfb at `ReadButton`.
- Expected PC `22`.
- Expected accumulator `00.004`.
- Expected `Result` = 00.004.
- ANZ values: 00.004.
