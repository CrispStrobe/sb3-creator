# lab-opamp-click-whistle — expected behaviour

## Circuit
- 9 V supply. One op-amp of the LM324 is an astable: three 100 kΩ at the + input set the thresholds; the output charges a 100 nF capacitor on the − input through 10 kΩ plus the **RATE** pot (470 kΩ, wired as a variable resistor).
- The output drives an 8 Ω loudspeaker through 47 µF and 100 Ω. The other three op-amps are parked.

## Observable behaviour
- RATE turned up (as authored, 480 kΩ in all): single clicks, about 12 a second.
- RATE turned down (10 kΩ left): the clicks run together into a whistle near 670 Hz.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: 12.6 clicks per second (±1.5) with RATE up, a 668 Hz tone (±30) with RATE down, read from the loudspeaker's tone edges.

## What this verifies
1. The period of an RC astable is proportional to R·C: 48 times the resistance gives about 50 times the period.
2. Below about 20 a second the ear hears separate clicks; above it, a pitch.

## Simulation notes
The output only reaches about 1.5 V below the supply, so each threshold sits a little lower than a third and two thirds of 9 V. The op-amp's rated slew rate (0.3 V/µs) is far from limiting at these rates.

```assert
# 1 ms after power-on: the 100 nF has only begun to charge through 480 kΩ
net lm324_3.1_neg V 0.09 +-0.03
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-click-whistle` prints them one by one.
<!-- engine-provenance -->
