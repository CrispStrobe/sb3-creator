# lab-gate-pump — expected behaviour

## Circuit
- 5 V supply, a 74HC132 quad Schmitt NAND. Gate 1 with 10 kΩ / 100 nF is an oscillator; gate 2, its inputs joined, buffers it. Gates 3 and 4 are unused (inputs grounded).
- The buffer drives the minus plate of a 10 µF pump capacitor. Its plus plate is fed from +5 V through diode D1 and passes charge through diode D2 into a 47 µF reservoir (both 1N4148).
- Load: a red LED with 10 kΩ and a voltmeter across the reservoir.

## Observable behaviour
- At switch-on the reservoir fills through the two diodes alone to about 3.8 V.
- The oscillator runs at about 1.25 kHz and the buffer swings about 4.9 V. While it is low D1 fills the pump capacitor to almost 5 V; when it goes high that charge is lifted by the swing and D2 passes it on.
- Within a few tens of milliseconds the output settles at about 8.65 V: nearly twice the supply, less two diode drops. The ripple is a few millivolts.

## Measured on the engine
1 ms: 3.83 V. 100 ms: 8.65 V, ripple 8.648–8.653 V. Clock 1247 Hz, buffer swing 4.89 V. `test/lab-circuits-r6d.test.mjs` holds these.

## Simulation notes
A CD4093 would let the same pump run on 9 V (to about 16.4 V, measured while building), but it has no breadboard footprint that the layout can seat yet, so the bench uses the 74HC132 on 5 V.

## What this verifies
1. A logic-gate oscillator can drive a diode-capacitor voltage doubler.
2. The output is the supply plus the swing, minus two diode drops.

```assert
# t = 1 ms: reservoir filled through the diodes, pumping just begun
net vsource_2.pos V 5.00 +-0.01
net diode_8.cathode V 3.83 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-gate-pump` prints them one by one.
<!-- engine-provenance -->
