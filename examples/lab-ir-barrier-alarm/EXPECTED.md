# lab-ir-barrier-alarm — expected behaviour

## Circuit
- 9 V supply. An IR LED with 330 Ω shines across 10 cm of air at a phototransistor whose emitter current through 22 kΩ is the receiver's signal. The light path's knob is a hand in the beam (0 clear, 1 blocked).
- Slide switch left: the signal drives the kill NPN (47 kΩ) on the LM386 tone oscillator's + input. Right: an inverter NPN (47 kΩ base, 22 kΩ collector) comes between.
- The oscillator: 47 kΩ / 100 kΩ, 1 nF, 10 kΩ and 100 nF; speaker through 47 µF and 47 Ω.

## Observable behaviour
- Left, beam intact: 2.2 V of signal keeps the kill NPN on: silence. Beam broken: the alarm sounds (about 616 Hz); clear the beam and it stops.
- Right: the tone sounds while the beam is intact and stops when it is broken (a 'beam OK' signal).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: beam intact: receiver 2.20 V, kill base 0.68 V, + input 0.04 V, no swing; blocked: receiver 0.00 V, alarm 616.0 Hz; cleared: 0.002 V swing; slide switch right, beam intact: 616.1 Hz; blocked: 0.002 V swing.

## What this verifies
1. An IR LED and a phototransistor make a light barrier.
2. One inverter transistor swaps 'alarm when broken' for 'tone while intact'.

## Simulation notes
The light follows the IR LED's simulated current along the light path; the knob sets how much of the beam is blocked.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net phototransistor_5.emitter V 2.20 +-0.05
net npn_13.base V 0.68 +-0.02
net lm386_14.inp V 0.044 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ir-barrier-alarm` prints them one by one.
<!-- engine-provenance -->
