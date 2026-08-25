# A2 LCD1602 moving text

The bench-verified direct 4-bit LCD connection: D4–D7 on P0.4–P0.7,
RS/RW/EN on P2.6/P2.5/P2.7. The title walks across the upper row while
the board name stays on the lower row.

Set J24 to OE–VCC so the 8×8 matrix releases P0. Insert the LCD rotated
180° from the visually obvious orientation; on the tested A2 it overlaps
the MCU slightly. The opposite orientation produces one blank and one
solid-white row.

