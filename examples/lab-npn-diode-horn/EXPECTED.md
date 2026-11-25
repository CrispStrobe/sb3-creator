# lab-npn-diode-horn — expected behaviour

## Circuit
9 V (`vsource_2`) through the key (`button_3`) to the whole oscillator. Q1 `npn_4`, Q2 `npn_5`, collector resistors 2.2 kΩ (`resistor_6`, `resistor_7`), base resistors 47 kΩ (`resistor_10`, `resistor_11`), coupling capacitors 100 nF (`capacitor_8` Q1 → Q2, `capacitor_9` Q2 → Q1). In the Q2 → Q1 path a germanium diode (`diode_12`, 1N34A; cathode at the capacitor, anode at Q1's base), with 47 kΩ (`resistor_14`) from the capacitor side to ground. **PLAIN** (`switch_13`, closed as authored) bridges the diode. Q3 `npn_16` drives the earphone `earphone_17` from Q2's collector through 10 kΩ.

## Observable behaviour
- Key up: silence, the circuit is unpowered.
- Key down, PLAIN closed: a low horn note of about 168 Hz; the earphone is on about half of each cycle.
- Key down, PLAIN open: the diode still lets the capacitor pull Q1's base down, but blocks it from being pushed back up through the base; the 47 kΩ lets that side relax only partly before the next edge, so Q1's off-time shortens. The note rises to about 198 Hz and the earphone is on about two thirds of each cycle: a different colour of sound.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs` (12 ms after keying, 15 ms windows):

| PLAIN | pitch | earphone on-share |
|---|---|---|
| closed | 168.4 Hz | 0.49 |
| open | 198.1 Hz | 0.67 |

## What this verifies
1. A diode passes a coupling edge in one direction only, which changes how an astable recovers.
2. Pitch and timbre (the waveform's duty) both change.

## Simulation notes
Without the 47 kΩ the capacitor's diode side had no way back down except the germanium diode's leakage (about 0.2 µA in the model): the oscillator stopped for the whole 60 ms tried. A real germanium diode leaks more and would give slow, irregular pulses; the bench uses the resistor so the note is defined.

```assert
# key up at t = 1 ms: unpowered
net vsource_2.pos V 9.00 +-0.01
net button_3.b V 0.00 +-0.01
net npn_4.collector V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-diode-horn` prints them one by one.
<!-- engine-provenance -->
