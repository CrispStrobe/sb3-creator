# Expected behaviour

A 4×8 dot-matrix animation with Prev/Next buttons. Eight frames are stored as
32-bit row-major bitmasks; the program selects one into `screen`, which the
matrix widget renders.

- Load the example, open the Controller view: a 4×8 matrix widget bound to
  `screen`, and Prev/Next buttons (`btnPrev`, `btnNext`).
- Green flag: frame 0 — an arrow pointing right.
- Press Next: the display advances through arrow-left, heart, diamond,
  checker, ring, all-on, X, then wraps back to the arrow.
- Press Prev: steps backward through the same eight frames, wrapping.
- The loop is live: button widget → `btnNext`/`btnPrev` → running program →
  `screen` → matrix face.

**Not verified on hardware** — behaviour is derived from the source under
emulation, not measured on a bench.
