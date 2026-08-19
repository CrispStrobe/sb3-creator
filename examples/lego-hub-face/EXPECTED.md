# Expected behaviour

A representative LEGO Spike Prime hub face: a 5×5 light matrix plus gauges for
motor angle, distance, and colour, all driven by variables (no hardware — the
widget faces read variables, as they would on a real hub).

- Load the example, open the Controller view: a 5×5 matrix widget
  (`hub_matrix`), and gauges for `motor_angle` (−180..180°), `dist_cm`
  (0..200 cm), and `colour_id` (0..10, LEGO colour IDs).
- Green flag: the program runs a live demo loop.
- The matrix cycles through four patterns — a vertical bar, a `\` diagonal, a
  horizontal bar, and a `/` diagonal — one every 200 ms.
- The motor-angle gauge sweeps −180° → +180° → −180° in 3° steps; the distance
  gauge tracks it as a slow triangle wave; the colour gauge cycles 0..10.
- The loop is live: running program → variables → matrix and gauge faces.

**Not verified on hardware** — behaviour is derived from the source under
emulation, not measured on a bench. The LEGO hub dialect is not yet in the
compiler, so when it lands `DEVICE SPIKE_PRIME` and real motor/sensor blocks
replace the variable writes; the widget faces are unchanged either way.
