# lab-moisture-beeper — expected behaviour

## Circuit
- 9 V supply. The probe, two bare wires in the nappy, is modelled by the **WET** pot: a 10 MΩ pot used as a variable resistor from +9 V into 10 kΩ and the base of q1 (NPN). Turned to 0 (as authored) it is 10 MΩ, dry; turned up the resistance falls to almost nothing, wet. This is a stand-in: the simulator has no "wires in a wet cloth" part. 100 kΩ from q1's base to its emitter keeps the dry probe's leakage (under 1 µA) from opening it.
- q1's collector: 1 kΩ and a blue LED from +9 V, lit when wet.
- q2 (NPN, 220 kΩ to its base from q1's collector) is an inverter. Its collector, with 4.7 kΩ from +9 V, is the base return of a transistor multivibrator (two NPN, 47 kΩ base resistors, 1 kΩ collectors, 22 nF); 470 Ω and 47 µF to an 8 Ω loudspeaker.

## Observable behaviour
- Dry: q1 off, q2 on and holding the multivibrator's base return low: dark and silent.
- Wet: q1 conducts, the blue LED lights, q2 lets go and the multivibrator sounds a tone of about 785 Hz.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: dry, LED current 0.031 mA and the base return at 0.132 V; wet, LED 7.1 mA and a 785 Hz tone.

## What this verifies
1. A tiny current through a wet probe is enough to switch a transistor.
2. An inverter transistor can hold an oscillator still by taking away its base current.

## Simulation notes
Real probes also polarise (electrolysis); the pot does not.

```assert
# dry: q2 conducts and holds the multivibrator's base return near ground
net npn_10.collector V 0.132 +-0.05
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **21 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-moisture-beeper` prints them one by one.
<!-- engine-provenance -->
