# lab-touch-paper — expected behaviour

## Circuit
- 9 V supply, from a mains adaptor: the field probe's `adaptorFarads` 1 nF couples the circuit's common to half the 230 V / 50 Hz mains.
- A metal plate under paper (field probe, source the learner's body, 20 pF through the paper at a firm press; knob = the press) on an NPN base, 1 MΩ base to ground, emitter to ground.
- The NPN collector drives a PNP base (100 kΩ to +9 V), the PNP emitter on +9 V, its collector through a red LED and 1 kΩ to ground.

## Observable behaviour
- Finger off: LED dark.
- Finger pressed (knob 1): the LED lights, flickering at 50 Hz, about 1.6 mA on average.
- Set `adaptorFarads` to 0 (battery): pressing does nothing.

## Measured on the engine
Pressed, mean LED current over 40 ms: 1.56 mA from the adaptor, 0 mA on a battery. `test/lab-circuits-fields.test.mjs` holds these.

## Why
The adaptor makes the whole circuit swing by about 150 V against the earth the learner stands on. The finger closes that loop through the paper's capacitance; the positive half-waves turn on the NPN, the PNP lights the LED. On a battery the circuit floats with the room, and the same press moves almost no current.

## What this verifies
1. Capacitive coupling through an insulator.
2. Why mains-powered touch circuits are more sensitive than battery ones.

```assert
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-touch-paper` prints them one by one.
<!-- engine-provenance -->
