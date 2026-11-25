# lab-amp-ic-spokes — expected behaviour

## Circuit
- LM386 (pins 1, 7, 8 open, −IN grounded) as a relaxation oscillator: output → 2.2 µF (+) → +IN.
- From +IN to ground: 1 kΩ in series with a 47 kΩ pot wired as a variable resistor (the "rate" knob), in parallel with the chip's own input resistance. As authored the knob is at 0: the full 47 kΩ.
- Output → 47 µF (+) → 47 Ω → loudspeaker → ground; output → 1 kΩ → yellow LED → ground.

## Observable behaviour
- Knob at 0: slow ticks, about 2.5 a second, the LED blinking with them (like a playing card in the spokes of a slowly turning wheel).
- Turning the knob up shortens the time constant: the ticks come faster and faster until, at full turn, they run together into a buzz of about 60 Hz.

## Measured on the engine
| knob | output edges (ms) | half-period | rate |
|---|---|---|---|
| 0 | 206, 404, 600, 798, 996 | 198 ms | 2.5 Hz |
| 1 | every 8 ms from 10 ms on | 8 ms | 62 Hz |

The speaker sees up to about 0.95 V at each edge.

## What this verifies
1. One variable resistor sweeps a relaxation oscillator over a 25:1 range of rates.
2. Clicks heard one by one at a few per second fuse into a tone once they come fast enough.

## Simulation notes
The resistance at +IN can never exceed the chip's own input resistance in parallel, which sets the slowest rate. `test/lab-circuits-r6b.test.mjs` times the edges at both ends of the knob.

```assert
# t = 1 ms: output high, +IN kicked up.
net lm386_3.vout V 8.073 +-0.05
net lm386_3.inp V 7.925 +-0.05
net potentiometer_6.a V 7.760 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-spokes` prints them one by one.
<!-- engine-provenance -->
