# lab-ir-flash-toggle — expected behaviour

## Circuit
- 9 V supply. The handset: SEND lights an IR LED through 100 Ω (about 75 mA while pressed, as a remote's LED is pulsed hard). The receiver is 10 cm away (light path knob 5–60 cm).
- A phototransistor from +9 V feeds 4.7 kΩ into the + input of an LM386 wired as a monoflop: − input at 3 V from 100 kΩ to +9 V (against the chip's internal input resistance), 2.2 µF from the output back to the + input, 100 nF from the + input to ground (it wakes up low), a diode against negative kicks.
- The output, through 1 kΩ onto a trigger line with 47 nF, toggles a diode-steered flip-flop (Q1 red = the lamp, Q2 green).

## Observable behaviour
- At switch-on the monoflop is idle (output 0.9 V) and the lamp (red) is off.
- SEND: the light lifts the + input past 3 V, the output jumps to 8.1 V and the capacitor holds it there for about 120 ms after the light has gone; then it falls back — and that falling edge toggles the flip-flop.
- One press, one toggle: on, off, on.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: switch-on output 0.90 V, − input 3.00 V, Q1 collector 7.18 V; three presses of 30 ms: output 8.10 V each time, falling back 120 ms after release; lamp on, off, on.

## What this verifies
1. A monoflop turns a light pulse of any length into one clean edge.
2. A toggle flip-flop counts presses modulo two.

## Simulation notes
Measured headless on the committed circuit; `test/lab-circuits-r6c.test.mjs` replays the learner's controls.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_9.inn V 3.00 +-0.01
net lm386_9.vout V 0.90 +-0.02
net npn_22.collector V 7.18 +-0.03
net npn_23.collector V 0.091 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ir-flash-toggle` prints them one by one.
<!-- engine-provenance -->
