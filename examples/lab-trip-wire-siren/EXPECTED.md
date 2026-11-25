# lab-trip-wire-siren — expected behaviour

## Circuit
- 9 V supply. A transistor flip-flop: Q1 (red LED and 1 kΩ in its collector) and Q2 (green LED and 1 kΩ), cross-coupled through 22 kΩ each; 1 µF on Q1's base makes Q2 win at switch-on.
- The trip wire is a closed switch holding the set line at ground; 22 kΩ pulls the line up when the wire breaks, and a diode with 10 kΩ passes it to Q1's base. The hidden RESET button grounds Q1's base.
- Q1's collector feeds the kill NPN (47 kΩ) on the + input of the LM386 tone oscillator (47 kΩ / 100 kΩ, 1 nF, 10 kΩ and 100 nF; speaker through 47 µF and 47 Ω).
- A slow astable (two NPN, 2.2 kΩ collectors, 4.7 µF and 33 kΩ, about 4 Hz): while its Q4 conducts, a diode and 33 kΩ pull on the oscillator's − input and lower the pitch.

## Observable behaviour
- Armed: Q2 conducts (green), Q1 is off and its high collector keeps the oscillator silent.
- Break the wire: Q1 turns on (red) and the siren sounds, alternating between about 500 Hz and 616 Hz as the astable runs.
- Mend the wire: the diode blocks — the alarm goes on. Only RESET (with the wire mended) re-arms it.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: armed Q1 collector 7.05 V, Q2 collector 0.09 V, + input 0.03 V, no swing; tripped Q1 collector 0.08 V; siren 499.8 Hz while the astable's Q4 conducts and 615.8 Hz while it is off; mended still 0.09 V and 7.17 V swing; reset 7.05 V and 0.001 V swing.

## What this verifies
1. A flip-flop with a diode-isolated set input remembers an event after its cause is gone.
2. A slow astable can modulate a tone oscillator by loading its timing node.

## Simulation notes
The astable runs all the time; only the alarm latch gates the siren.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_3.collector V 7.05 +-0.05
net npn_4.collector V 0.091 +-0.03
net lm386_19.inp V 0.027 +-0.02
net switch_13.a V 0.000 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-trip-wire-siren` prints them one by one.
<!-- engine-provenance -->
