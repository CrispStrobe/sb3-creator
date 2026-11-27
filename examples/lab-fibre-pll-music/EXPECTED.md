# lab-fibre-pll-music — expected behaviour

## Circuit
- 9 V supply. Transmitter: a music generator (`function_gen_3`, a 5 kHz test tone, 1 V peak) into an LM358 (`lm358_5`) inverting stage (10 kΩ / 10 kΩ) whose + input sits on a centre pot (`potentiometer_4`): its output is twice the pot's voltage minus the music.
- That output feeds both 6.8 kΩ base resistors of a two-transistor astable (`npn_9`, `npn_10`, 1 nF, 1 kΩ collector on one side, a red LED and 470 Ω on the other): a higher voltage charges the capacitors faster, so the LED flashes 65–90 thousand times a second, faster or slower with the music.
- A 2 m light guide to a phototransistor (`phototransistor_17`, 1 kΩ emitter load), 1 nF into the 4046's signal input (`cd4046_20`). The VCO (10 kΩ, 220 pF) is held on the incoming rate by comparator II through 10 kΩ and 1 kΩ + 4.7 nF.
- The demodulator output (the VCO's control voltage, 10 kΩ load) is filtered by 10 kΩ / 10 nF and coupled by 1 µF into an LM386 (`lm386_30`, gain 20) driving a magnetic earphone through 10 µF.

## Observable behaviour
- The VCO runs near the transmitter's rate.
- The demodulator output carries the 5 kHz music; with the amplitude at 0 it does not.

## Measured on the engine
bw-board r9/engine-robust-20261125 / bw-circuit-ui e3441d2, `test/lab-circuits-r9.test.mjs` (after 0.25 ms, sampled every 5 µs for 0.2 ms).

| quantity | value |
|---|---|
| VCO (at the end of the window) | 66 kHz (80 kHz in a run with the music at 0) |
| 5 kHz at the demodulator output | 0.66 V |
| 10 kHz there (not sent) | below a third of that |
| same, music amplitude 0 | 0.12 V at 5 kHz |

## What this verifies
1. Frequency modulation of a transistor astable by an op-amp.
2. A 4046 loop as an FM demodulator: its control voltage follows the incoming rate.

The link is fast for the simulator: each simulated millisecond costs minutes, so the test keeps to half a millisecond.

```assert
# t = 1 ms (the music crosses zero)
net potentiometer_4.wiper V 3.15 +-0.01
net lm358_5.1_out V 6.28 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-fibre-pll-music` prints them one by one.
<!-- engine-provenance -->
