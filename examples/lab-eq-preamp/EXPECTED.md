# lab-eq-preamp — expected behaviour

## Circuit
- 9 V supply. The function generator stands in for a record player's pickup: a 1 mV sine (100 Hz as built).
- Two common-emitter stages, each 100 kΩ / 15 kΩ base divider, 4.7 kΩ collector, 470 Ω emitter (a gain of about 10), coupled through 470 nF; the second feeds the LM386's + input through 100 nF.
- The LM386 at gain 20 (pins 1 and 8 open) drives the speaker through 220 µF. The EQ switch (closed as built) puts 2.2 kΩ and 22 nF in series from the output (pin 5) to pin 1: wherever the capacitor conducts it parallels the chip's internal feedback resistor.

## Observable behaviour
- Bass (100 Hz): the 22 nF hardly conducts; the EQ takes almost nothing off the output.
- Treble (3 kHz): with the EQ the output drops to under a quarter; switched out, the treble is as loud as the bass.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs` (output swing after 120 ms): 100 Hz: 2.16 V pp with the EQ out, 2.11 V pp with it in; 3 kHz: 2.42 V pp out, 0.55 V pp in.

## What this verifies
1. A frequency-dependent network in the feedback path shapes the response (an equaliser).
2. Treble cut relative to bass, the shape a magnetic pickup needs.

## Simulation notes
The coupling capacitors take about 100 ms to settle after switch-on; the test measures after 120 ms.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_7.base V 0.18 +-0.02
net npn_7.collector V 4.45 +-0.05
net lm386_17.vout V 6.24 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-eq-preamp` prints them one by one.
<!-- engine-provenance -->
