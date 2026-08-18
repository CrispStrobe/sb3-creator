# Expected behaviour

- Boot: the display shows `0` (rightmost digit), leading digits blank.
- Typing `1 2 3` shows `123`; `A` then `4 5`, then `#` shows `168`.
- Chain: `2 C 3 C 4 #` shows `24` (left-to-right, no precedence).
- `÷` by zero shows `0` (guarded), results clamp to 0…99999999.
- `*` clears the entry only; K1 clears everything; K2 removes the last
  typed digit; K3/K4 are M+ / MR.
- The display multiplexes: exactly one common is active at a time
  (~1 ms per digit, ~125 Hz per tube — steady to the eye in SIM).
