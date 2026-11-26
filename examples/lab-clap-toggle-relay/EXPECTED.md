# lab-clap-toggle-relay — expected behaviour

## Circuit
- 9 V supply. A loudspeaker is the microphone (sound level 0 dB as built; noise, like a clap). An LM386 at gain 200: 10 µF across pins 1 and 8, with the sensitivity pot (10 kΩ, fully up) in series.
- 1 µF and two germanium diodes pump each burst into 220 nF (100 kΩ drains it), which turns on a pulse NPN through 4.7 kΩ. Its collector is the trigger line (10 kΩ to +9 V).
- A diode-steered toggle flip-flop (Q1 red, Q2 green; 22 kΩ / 27 kΩ with 1 nF; steering 47 nF, 470 kΩ and diodes).
- A relay driver NPN fed from Q2's collector through 22 kΩ: relay (200 Ω coil, flyback diode); its contact lights a 9 V lamp.

## Observable behaviour
- Switch-on: Q2 conducts (green), the relay is out, the lamp dark.
- A clap (the Sound slider to 120 dB for a moment): the pulse NPN pulls the trigger line down ONCE for the whole clap; the flip-flop toggles, Q2's collector rises, the relay pulls in and the lamp lights.
- The next clap toggles it back: relay out, lamp dark. Talking at 70 dB is too quiet to trigger.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: after 100 ms Q1 collector 7.20 V, Q2 0.09 V, relay out; talking at 70 dB for 40 ms: relay out, trigger line steady at 9.00 V; first clap (120 dB, 20 ms): Q1 collector 0.10 V, relay in, lamp lit; second clap: Q1 collector 7.20 V, relay out.

## What this verifies
1. Rectifying and smoothing turn a burst of sound into a single switching edge.
2. A toggle flip-flop turns 'one event' into 'change state'.

## Simulation notes
The clap is the speaker's noise sound at 120 dB SPL for 20 ms in the test. Never wire mains on a breadboard: the lamp stands in for the appliance.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_21.collector V 7.18 +-0.03
net npn_22.collector V 0.091 +-0.03
net lm386_4.vout V 4.50 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-clap-toggle-relay` prints them one by one.
<!-- engine-provenance -->
