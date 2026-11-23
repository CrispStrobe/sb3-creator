# lab-discrete-monostable — expected behaviour

## Circuit
9 V. A 100 µF timing electrolytic charges through 100 kΩ; the button empties it through 100 Ω. Its voltage
reaches Q1's base through 4.7 kΩ. Q1 and Q2 share one 330 Ω emitter resistor (an emitter-coupled Schmitt
trigger). Q1's collector has 1 kΩ plus a red LED and feeds Q2's base through 47 kΩ; Q2's collector has 1 kΩ
plus a green LED.

## Observable behaviour
- Resting: the capacitor is charged (about 2.75 V, held there by Q1's base current), Q1 conducts and red is
  lit with about 5.3 mA. Q1's collector is low, so Q2 is off and green is dark.
- Press the button: the capacitor is emptied at once, Q1 switches off, its collector rises and turns Q2 on.
  Green lights (about 5.1 mA), red goes dark (a faint 0.1 mA still flows through it into Q2's base).
- Holding the button keeps it green; the timer starts on release.
- After release the capacitor refills through 100 kΩ. When it passes about 3.0 V, Q1 takes over again: green
  goes out and red comes back, about 4.3 s after the release.
- The switch-over is sudden, not a slow fade: as Q1 starts to conduct, Q2's current falls, the shared emitter
  voltage drops and Q1 is pushed on even harder.
- At power-on the capacitor starts empty, so the bench begins with a green period of the same length.

## What this verifies
1. A monostable has one stable state (red) and one timed state (green).
2. The time is set by R · C (100 kΩ · 100 µF = 10 s time constant; the switch point is reached after about
  0.4 of it).

```assert
# power-on at t = 1 ms: capacitor empty, Q2 (green) conducts
net vsource_2.pos V 9.00 +-0.01
net polarized_cap_4.pos V 0.00 +-0.01
net npn_9.collector V 1.84 +-0.05
net resistor_15.a V 1.72 +-0.05
```
