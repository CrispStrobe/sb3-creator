# lab-pll-hygrometer — expected behaviour

## Circuit
- 9 V supply. A salt-film humidity comb (`humidity_comb_3`: ten megohms at 50 % relative humidity, ten times less for every 12 % more) has one end on ground; a slide switch (`slide_switch_4`) connects its other end either to pin R1 of a 4046 (tone, left) or into a bridge (meter, right).
- Tone: the 4046 (`cd4046_5`) with VCO_IN on +9 V, R2 open and C1 = 1 nF. The comb is its R1, so f = 1 / (2 · R_comb · 1 nF). VCO_OUT through 100 kΩ and 2.2 kΩ into an LM386 (`lm386_9`, 1 µF on BYPASS), 220 µF to the speaker.
- Meter: 1 MΩ from +9 V to the comb (node A) against 1 MΩ / 1 MΩ (node B, 4.5 V). A meter (`analog_meter_16`, 2 V full scale, half a megohm) reads B minus A.

## Observable behaviour
- Tone: 50 % RH gives only a slow tick; 60 % about 340 Hz; 66 % about 1.08 kHz. Breath on the comb sends it up steeply.
- Meter: negative in dry air, zero at 62 % RH (where the comb is 1 MΩ), positive in moist air.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| humidity | comb | tone | meter (bridge position) |
|---|---|---|---|
| 50 % | 10 MΩ | (about 50 Hz) | −0.96 V |
| 60 % | 1.47 MΩ | 340.7 Hz | — |
| 62 % | 1.00 MΩ | — | 0.00 V |
| 66 % | 0.46 MΩ | about 1.08 kHz | — |
| 74 % | 0.10 MΩ | — | +1.69 V |

## What this verifies
1. A salt film conducts better the more water it takes up from the air: its resistance falls about tenfold for every 12 % of relative humidity.
2. As the 4046's R1 it sets the charging current of C1, so the pitch is inversely proportional to its resistance.
3. In a bridge the same comb moves a meter through zero at the humidity where it equals the fixed arm.

## Simulation notes
The comb's resistance is the engine's model (bw-board sensing-transducers.js); the humidity is the learner's slider (0..1 = 0..100 %). The meter's 500 kΩ loads the 1 MΩ arms, which is why its readings are smaller than the open-circuit bridge voltage.

```assert
# t = 1 ms, 50 % RH, tone position: pin R1 held at VCO_IN = 9 V, bridge node B at 4.5 V less the meter's pull
net cd4046_5.r1 V 9.00 +-0.01
net resistor_14.b V 5.63 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 42** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-hygrometer` prints them one by one.
<!-- engine-provenance -->
