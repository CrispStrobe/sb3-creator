# lab-led-tester — expected behaviour

## Circuit
- 9 V supply. The circuit under test is a green indicator LED behind a **BREAK** switch (closed as authored: the wire is intact), with a **SHORT** switch across the LED.
- The tester sends current from +9 V through 1 kΩ into it and halves the probe voltage (10 kΩ / 10 kΩ).
- LM324 op-amp 1: + on the halved probe, − at 3.0 V (20 kΩ / 10 kΩ): high when the circuit is open. Op-amp 2: + at 0.42 V (82 kΩ / 4 kΩ), − on the halved probe: high when it is shorted.
- Op-amp 1 reaches a 47 kΩ to ground through a 1N4148; op-amp 2 through 47 kΩ and a 1N4148. Op-amp 3 follows that node, then 1 kΩ and 1 µF, into the 47 kΩ base resistors of a transistor multivibrator (two NPN, 1 kΩ collectors, 22 nF), which plays through 470 Ω and 47 µF into an 8 Ω loudspeaker.

## Observable behaviour
- LED fine: it lights, the probe sits at 1.8 V (0.91 V halved), both comparators low, silence.
- BREAK open: the probe rises to 8.6 V, a higher tone (about 717 Hz).
- SHORT closed: the probe falls to 0 V, a lower tone (about 602 Hz).

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: halved probe 0.911 V with the LED fine and the follower at 0.005 V (no tone); open 717 Hz, short 602 Hz (from the loudspeaker's edges, 4–10 ms after switching); no edges once the LED is fine again.

## What this verifies
1. A window comparator (two comparators) sorts a voltage into too high, fine and too low.
2. The voltage a multivibrator's base resistors return to sets its pitch, and zero stops it.

## Simulation notes
The two pitches are read a few milliseconds after the fault appears, while the 1 µF behind the follower has settled.

```assert
# LED fine: the probe at one LED drop, both comparators low, no tone
net resistor_7.b V 0.911 +-0.01
net resistor_10.b V 3.00 +-0.01
net resistor_12.b V 0.419 +-0.005
net lm324_9.1_out V 0.005 +-0.01
net lm324_9.2_out V 0.005 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **25 of this page's 33** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-led-tester` prints them one by one.
<!-- engine-provenance -->
