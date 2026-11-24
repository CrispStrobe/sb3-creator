# lab-noise-drum — expected behaviour

## Circuit
- 9 V supply. The noise source of lab-noise-hiss: 47 kΩ into the emitter of an NPN with `bvEbo` 7.5 (volts), base grounded, collector open (simulated noise band 1 kHz).
- 100 nF into a common-emitter stage (470 kΩ collector-to-base, 4.7 kΩ), 1 µF into an output stage (470 kΩ collector-to-base, 470 Ω emitter resistor) whose collector load is a 2 kΩ magnetic earphone.
- The earphone's top end is NOT on +9 V: it hangs on a 10 µF electrolytic, which a push button charges from +9 V through 100 Ω.

## Observable behaviour
- Before the first press: practically silent (earphone level below 0.06).
- A short press: the capacitor jumps to 9 V and the earphone hisses (level about 0.14, reported as noise).
- After release the capacitor drains through the earphone and the output transistor: about 7 V 30 ms later, below 0.3 V after 0.28 s, and the hiss fades to nothing (level 0.005).

## Measured on the engine
The button pressed first, then released (10 ms):

| after release | capacitor | earphone |
|---|---|---|
| 30 ms | 7.10 V | level 0.143, noise |
| 280 ms | 0.28 V | level 0.005 |

`test/lab-circuits-fields.test.mjs` holds these.

## Why
The capacitor is the output stage's only supply. The noise keeps coming, but the current that carries it to the earphone falls with the capacitor's voltage: an envelope with a fast attack (the button) and a decay set by the capacitor and the stage's current.

## What this verifies
1. A capacitor as a short-lived supply shapes a sound's envelope.
2. Noise with an envelope is a percussive sound.

```assert
# the supply rail; the junction reaches its breakdown voltage only once the
# coupling capacitor behind it has charged (about 5 ms), which the scenario
# test checks at 40 ms
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@5c83e54` and `bw-circuit-ui@089ee40` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-noise-drum` prints them one by one.
<!-- engine-provenance -->
