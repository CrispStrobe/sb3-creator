# lab-magnet-drop — expected behaviour

## Circuit
- 9 V supply. A hand-wound coil (`air_coil_3`: 1000 turns of 0.2 mm wire on a 3 cm tube, 1.5 cm radius) has one end on ground; the other reaches the base of Q1 (`npn_8`) through a diode and 1 kΩ. 100 kΩ keeps that base quiet.
- Q1 and Q2 (`npn_9`) are a flip-flop: each collector feeds the other's base through 22 kΩ. The red LED shows Q1 conducting, the green one Q2. 1 µF on Q1's base makes Q2 win at switch-on; the push button (reset) pulls Q1's base to ground.
- The **Drop magnet** button in the instruments column drops a bar magnet (north pole first) through the coil from 20 cm.

## Observable behaviour
- At rest: green on (Q2 collector 0.09 V), red off.
- Drop: about 0.19 s later the magnet reaches the coil. Entering, it induces about +2.4 V at the coil's top end; the pulse turns Q1 on and the LEDs swap: red on. Leaving, it induces an opposite, bigger pulse (it falls faster by then), which the diode blocks.
- Reset button: green again.
- Turn the magnet over (`magnetPolarity` −1) and drop it: it still flips, now on the exit pulse, a few milliseconds later.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs`: entry pulse 2.42 V, flip 190 ms after the drop, reset restores, the turned-over magnet flips later.

## What this verifies
1. A changing magnetic flux induces a voltage (Faraday): only while the magnet moves, opposite on the way in and out.
2. A flip-flop remembers a single short pulse.

## Simulation notes
The magnet is a point dipole (1 A·m², a 1 cm neodymium cube) falling freely on the coil's axis; the flux it links follows the thin-solenoid formula. The braking force of the induced current on the magnet is neglected.

```assert
# power-on: Q2 conducting (green), Q1 off (red dark), no magnet moving
net vsource_2.pos V 9.00 +-0.01
net npn_9.collector V 0.09 +-0.05
net npn_8.collector V 7.20 +-0.1
net air_coil_3.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-magnet-drop` prints them one by one.
<!-- engine-provenance -->
