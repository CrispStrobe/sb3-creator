# lab-thermocouple-millivolts — expected behaviour

## Circuit
- No battery. A copper/constantan thermocouple (`thermocouple_3`, type T, 5 Ω) is wired straight to a moving-coil meter (`analog_meter_4`, params fullScale 0.05 and ifs 0.0001: a 0.1 mA movement). Its tip starts in a match flame (600 °C); the free ends are at the bench temperature.
- A ground symbol (`gnd_2`) on the negative lead gives the solver its reference.

## Observable behaviour
- Room temperature: the needle rests at zero.
- Match (600 °C): about 31.5 mV.
- Lighter (900 °C): about 49.4 mV, almost full scale.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`.

| tip | EMF | meter |
|---|---|---|
| 25 °C | 0 mV | 0 mV |
| 600 °C | 31.82 mV | 31.51 mV |
| 900 °C | 49.85 mV | 49.36 mV |

## What this verifies
1. The thermocouple's EMF depends on the difference between the hot tip and the cold ends.
2. The meter's coil resistance is a hundred times the thermocouple's, so it reads 99 % of the EMF: a sensitive movement needs no amplifier for tens of millivolts.

```assert
# t = 1 ms, tip at 600 C
net analog_meter_4.a V 0.0315 +-0.0005
net analog_meter_4.b V 0.000 +-0.0001
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **1 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-thermocouple-millivolts` prints them one by one.
<!-- engine-provenance -->
