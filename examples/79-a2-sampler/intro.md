# The A2 sampler

Every part of the Prechin A2's new block vocabulary in one program: the
4×4 keypad (with the measured P1 row/column map), the 8-digit 7-segment
display behind its 74HC245/74HC138 pair, and the 8 LEDs — running at the
same time.

- Press any key: its number (0–15) appears on the display, via the
  `a key is pressed` reporter and the scanned-key index.
- The LEDs chase continuously — `light only led N`, one step every
  120 ms.
- `*` (key 12) clears the display back to 0 — a `WHEN key 12 pressed:`
  edge hat, fired once per press by the debounced shared scan.
- `#` (key 14) pauses and resumes the chase — a second edge hat.

One deliberate compiler warning is part of the lesson: on the real A2,
the LEDs and the display's 74HC138 select pins **share port P2**. The
compiler says so — and the program still works, because every LED write
goes through an ISR-owned shadow byte and the interrupt is the only
thing that ever touches the port.
