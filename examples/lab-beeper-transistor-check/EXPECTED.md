# lab-beeper-transistor-check — expected behaviour

## Circuit
- The beeper of lab-beeper-diode-check: an LM386 relaxation oscillator into a loudspeaker, held silent by a kill NPN that a sense NPN releases when current arrives from the red probe (4.5 V from two 1 kΩ) at the black probe (4.7 kΩ into the sense base, 47 kΩ to ground).
- The device under test is an NPN transistor. Six toggle switches are the probe clips: red to base, collector or emitter (switch_19, switch_20, switch_21), black to base, collector or emitter (switch_22, switch_23, switch_24).

## Observable behaviour
- Red on base, black on emitter: tone. Red on base, black on collector: tone.
- Red on emitter or collector, black on base: silence. Collector and emitter either way: silence.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: idle 0.001 V pp; base→emitter 7.173 V pp, base→collector 7.179 V pp; emitter→base 0.002, collector→base, collector→emitter and emitter→collector 0.000 V pp.

## What this verifies
1. An NPN transistor behaves as two diodes whose anodes meet at the base.
2. Without base current no current flows between collector and emitter, in either direction.
3. The base is the one lead that conducts to both others: that is how it is found.

## Simulation notes
The red probe is only 4.5 V (two 1 kΩ across the supply), so a reversed junction never sees more than that: a real base-emitter junction breaks down somewhere around 6–9 V and would then beep falsely. The engine's transistors have no reverse breakdown at all.

```assert
# 1 ms after switch-on (the solve assert-physics runs): no clips closed, tone held off
net lm386_3.vout V 0.897 +-0.02
net npn_13.base V 0.688 +-0.02
net npn_16.base V 0.000 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-beeper-transistor-check` prints them one by one.
<!-- engine-provenance -->
