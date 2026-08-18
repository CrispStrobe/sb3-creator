# Expected behaviour

- Boot: the display shows `0`; the LED chase runs (one LED at a time,
  ~120 ms per step, wrapping after LED 7).
- Holding any keypad key shows its index (0–15) on the display; the
  value stays after release.
- Key 12 (`*`): display resets to 0 — fires once per press (edge hat,
  debounced: a bouncing contact cannot fire it twice).
- Key 14 (`#`): the chase freezes; pressing again resumes it.
- Compile: exactly one warning — `leds on P2 shares a port with
  display's select pins` — deliberate; the ISR-owned shadow byte is why
  the program is correct anyway.
