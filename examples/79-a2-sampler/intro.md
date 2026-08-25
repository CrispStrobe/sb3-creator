# The A2 sampler

The Prechin A2's 4×4 keypad and 8-digit 7-segment display running
together, using the measured P1 matrix and the 74HC245/74HC138 display
wiring.

- Press any key: its number (0–15) appears on the display, via the
  `a key is pressed` reporter and the scanned-key index.
- `*` (key 12) clears the display back to 0 — a `WHEN key 12 pressed:`
  edge hat, fired once per press by the debounced shared scan.
- `#` (key 14) sets the internal `hash_seen` flag — a second edge hat.

The LED row is deliberately not combined with the display. On the real
A2 it is hard-wired to all of P2, while P2.2–P2.4 also address the
74HC138. Those changing select bits visibly drive D3–D5, so the two
devices cannot show independent stable patterns. Use the separate LED
row example when testing D1–D8.
