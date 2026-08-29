# pybadge01-hello — expected behaviour

The Arcade / PyBadge console is a self-contained board: the screen and the
D-pad / A / B buttons are the whole device. There is nothing to wire, which
is why this example ships no `circuit.json` and is enrolled as device-only.

- Load the example and open the Controller view: a 4×4 matrix widget
  (`screen`), a D-pad (`dpad`), and the A/B buttons (`btnA`, `btnB`).
- Green flag: the cursor sits at the top-left cell, `board` is 0, `stamps`
  is 0, and `screen` is 1 — bit 0 lit, which is the cursor alone.
- The D-pad moves the cursor inside the 4×4 grid, clamped at every edge, and
  moves **once per press**: the direction is read on the edge
  (`NOT dpad = lastdpad`), so holding a direction does not run the cursor
  off across the board.
- **A** toggles the cell under the cursor: the first press adds
  `2^(cy*4+cx)` to `board` and counts one more stamp; pressing A again on the
  same cell removes both. Also edge-triggered, so one press is one stamp.
- **B** clears: `board` and `stamps` go back to 0 and the button latch is
  released.
- Every pass renders `screen = board + cursor`, except when the cursor is
  already standing on a stamped cell — then `screen = board`, so the two
  never double-count the same bit.

The loop is live end to end: D-pad and button widgets → variables → the
running program → `screen` → the matrix face. Nothing here is a placeholder;
pressing a control changes a variable on the next 50 ms pass.

**Not verified on hardware** — behaviour is derived from the source under the
simulator driver, not measured on a bench.
