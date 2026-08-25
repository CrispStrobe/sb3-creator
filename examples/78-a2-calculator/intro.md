# The A2 calculator

A chain calculator on the Prechin A2's own hardware vocabulary: eight
7-segment digits (two 4-digit tubes — shared segment bus on P0, one
common per digit on P2), the 4×4 red keypad on P1 with the A2's
measured row/column map, and the four black keys on P3 as edit/memory
keys.

- **Red keypad**: `1–9, 0` enter digits; `A B C D` are `+ − × ÷`;
  `#` is equals; `*` clears the current entry.
- **Black keys**: K1 clears everything, K2 is backspace, K3 adds the
  shown value to memory (M+), K4 recalls memory (MR).

Two cooperative tasks share the chip — one multiplexes the display at
about 125 Hz from a single `shown` value (computing each digit by
division, with leading-zero blanking), the other scans the keys and
runs the calculator. The same program compiles to C for the real
STC89C52RC: on the physical A2 the commons run through the 74HC138
and the segments through the 74HC245, but the port meanings (P0 =
segments, P2 = select, P1 = keypad) are exactly the board's own.
