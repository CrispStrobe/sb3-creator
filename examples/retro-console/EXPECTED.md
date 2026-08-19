# Expected behaviour

A dual-matrix retro console: a 4×4 game matrix shows a player dot that moves
with the D-pad and leaves a trail; a 4×4 status matrix shows remaining lives
as a top-row bar.

- Load the example, open the Controller view: two 4×4 matrix widgets
  (`game_screen`, `status_screen`), a D-pad (`dpad`), and Fire/Start buttons
  (`btnFire`, `btnStart`).
- Green flag: the player dot sits at the top-left of the game matrix; the
  status matrix shows three lit dots (3 lives).
- D-pad up/down/left/right moves the dot within the 4×4 grid, clamped at the
  edges.
- Fire toggles the current cell in the trail, so moving away leaves a lit dot.
- Start resets: dot to top-left, trail cleared, lives back to 3.
- The loop is live: D-pad/button widgets → variables → running program →
  `game_screen`/`status_screen` → matrix faces.

**Not verified on hardware** — behaviour is derived from the source under
emulation, not measured on a bench.
