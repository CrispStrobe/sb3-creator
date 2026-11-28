# lab-amp-struck-note — expected behaviour

## Circuit
- 9 V battery. The KEY charges a 100 µF electrolytic through 10 Ω; that capacitor is the LM386 oscillator's whole supply (220 nF timing capacitor, about 295 Hz). Speaker through 47 µF and 47 Ω.

## Observable behaviour
- Key never pressed: no supply, silence.
- Key down: the capacitor charges to about 8.5 V and the note sounds at full strength.
- Let go: the amplifier drains the capacitor, the output's swing (0.9 V from each rail) shrinks with it, and below about 4 V the amplifier stops; about 3.5 V are left on the capacitor. The pitch hardly changes, because the thresholds are fractions of the supply.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: key up 0 V on the capacitor; key down 8.50 V; after release the output swing in successive 8 ms windows: 6.65, 4.66, 3.17, 2.01, 0.01 V pp (capacitor 6.54 → 3.50 V); 3.48 V left on it.

## What this verifies
1. A capacitor as a short-lived supply gives a percussive envelope.
2. A threshold-ratio oscillator keeps its pitch as its supply falls.

## Simulation notes
Measured headless on the committed circuit; `test/lab-circuits-r6c.test.mjs` replays the learner's controls.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net vsource_2.pos V 9.00 +-0.01
net lm386_6.vs V -0.000 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-struck-note` prints them one by one.
<!-- engine-provenance -->
