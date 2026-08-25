# The A2 calculator

A chain calculator on the Prechin A2's own hardware vocabulary: eight
7-segment digits (two 4-digit tubes — shared segment bus on P0, one
common per digit on P2), the 4×4 red keypad on P1 with the A2's
measured row/column map, and the four black keys on P3 as edit/memory
keys.

- **Red keypad**: the measured silk-screen is `3 7 B F / 2 6 A E /
  1 5 9 D / 0 4 8 C`. Digits enter normally; `A B C D` are `+ − × ÷`,
  `E` clears the entry, and `F` is equals.
- **Black keys**: K1 clears everything, K2 is backspace, K3 adds the
  shown value to memory (M+), K4 recalls memory (MR). Remove both P5
  UART shunts after flashing to free P3.1/P3.0 for K1/K2.

The `SEVENSEG8` part refreshes the display at about 125 Hz from its
timer ISR while the main task scans the keys and runs the calculator.
On the physical A2 the commons run through the 74HC138 and the segments
through the 74HC245: P0 is the segment bus and P2.2–P2.4 are the binary
digit address.
