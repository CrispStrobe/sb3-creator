# Expected behaviour

- Boot: the display shows `0`.
- Holding a key shows its scanned index (0–15) on the display. The value
  stays after release. The clear key has its own action.
- Key 12 (`*`): display resets to 0 — fires once per press (edge hat,
  debounced: a bouncing contact cannot fire it twice).
- Key 14 (`#`): the internal `hash_seen` flag becomes 1; the display keeps
  showing the scanned key index.
- Compile: no shared-port warning; the electrically incompatible LED-row
  refresh is kept in its own example.
