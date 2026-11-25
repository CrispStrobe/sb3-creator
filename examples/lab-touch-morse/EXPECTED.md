# lab-touch-morse — expected behaviour

## Circuit
- 9 V supply. The LM386 tone oscillator (47 kΩ and 100 kΩ on the + input, 1 nF speed-up, 10 kΩ and 100 nF on the − input) into a loudspeaker through 47 µF and 47 Ω.
- A kill NPN from the + input to ground holds the oscillator off while it conducts. Its base is fed from a node pulled up by 47 kΩ, through a diode and 10 kΩ; 47 kΩ holds the base down when that feed stops.
- A Darlington (two NPN) hangs from that node. The touch contacts are a button with 2.2 MΩ of skin to +9 V into the first base.

## Observable behaviour
- Untouched: the kill NPN conducts, the + input sits at 0.03 V, the output stays at 0.9 V: silence.
- A fingertip on the contacts: the Darlington pulls the node to 0.69 V, too little to push current through the diode; the kill transistor's base falls to 0.28 V, it lets go, and the oscillator plays about 616 Hz.
- Let go: silence again at once — dots and dashes.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: untouched + input 0.028 V, output 0.897 V, kill base 0.686 V, swing 0.003 V; touched node 0.687 V, kill base 0.277 V, tone 615.9 Hz; released swing 0 V at 0.90 V.

## What this verifies
1. A Darlington's gain makes a fingertip's microamps enough to switch.
2. Gating an oscillator by holding one input is a clean on/off key.

## Simulation notes
The skin is modelled as 2.2 MΩ behind a button.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_12.inp V 0.028 +-0.02
net npn_11.base V 0.69 +-0.02
net resistor_7.b V 2.55 +-0.05
net lm386_12.vout V 0.90 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-touch-morse` prints them one by one.
<!-- engine-provenance -->
