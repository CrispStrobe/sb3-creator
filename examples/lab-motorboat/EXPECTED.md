# lab-motorboat — expected behaviour

## Circuit
- 9 V supply. Slide switch **weak**: left puts the battery straight on the rail, right (authored) through 47 Ω (a run-down battery).
- Output stage: NPN with 22 kΩ collector-to-base, 100 Ω in series with an 8 Ω loudspeaker as its collector load, from the rail.
- First stage: NPN, 1 MΩ collector-to-base, 10 kΩ collector resistor; 1 µF into the second stage, NPN, 470 kΩ collector-to-base, 4.7 kΩ; 10 µF into the output stage.
- Slide switch **dec**: left (authored) feeds the first two stages from the rail; right through 1 kΩ with 470 µF to ground.

## Observable behaviour
- Weak battery, no decoupling: the rail swings between about 6.2 V and 8.7 V on its own, about 9 times a second; the loudspeaker putters.
- Fresh battery: steady rail, silence.
- Weak battery with decoupling: the rail settles, the oscillation dies.

## Measured on the engine
From 0.3 s to 0.5 s: rail 6.20–8.71 V at 9.2 Hz (weak, no decoupling); 9.00 V steady (fresh); 7.21–7.30 V, drifting slowly, silent (weak, decoupled). `test/lab-circuits-fields.test.mjs` holds these.

## Why
The output stage's tens of milliamps flow through the 47 Ω. A change of that current moves the rail; the rail moves the first stage's collector; the second stage inverts the change and drives the output stage's base the way that changes its current further. With the coupling capacitors in the loop this becomes a slow relaxation oscillation. The 1 kΩ and 470 µF give the first two stages a supply that the output current cannot move.

## What this verifies
1. Supply impedance couples all stages of an amplifier.
2. Decoupling breaks that loop.

```assert
# the supply itself; the oscillation is checked in the scenario test
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-motorboat` prints them one by one.
<!-- engine-provenance -->
