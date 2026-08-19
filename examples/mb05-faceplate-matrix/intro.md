# The matrix faceplate

No pins, no breadboard — the **Controller panel is the hardware**. Load
this example and open the Controller view: a 5×5 dot-matrix display and
two buttons appear, already wired.

- The buttons **write** the program variables `btnA` / `btnB` the moment
  you press them.
- The program answers by writing `screen` — one number, a 25-bit
  row-major bitmask (bit `row·5+col` = dot lit).
- The matrix widget **reads** `screen` live and lights the dots.

Press A for an X, B for a bar, nothing for a single corner dot. This is
the reference *faceplate triplet* — widgets + program + bindings — that
composite device faceplates (calculator, A2 keypad + LCD, retro dual
matrix…) are built from.
