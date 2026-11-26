# lab-pll-lock — expected behaviour

## Circuit
- 9 V supply. Reference: a two-transistor astable (`npn_5`, `npn_6`; 1 kΩ collector resistors, 47 nF; 22 kΩ to one base, 2.2 kΩ plus the 50 kΩ tune potentiometer `potentiometer_11` to the other). As built (pot at 0.69) it runs at about 740 Hz; the pot moves it between about 420 Hz and 1.3 kHz.
- A 4046 (`cd4046_12`): VCO with R1 = 100 kΩ, R2 = 47 kΩ, C1 = 10 nF, so it can run from 532 to 1032 Hz. The astable's collector drives SIG_IN, VCO_OUT drives COMP_IN.
- Comparator II (PC2_OUT) through 47 kΩ, with 100 kΩ and 22 nF to ground, is the loop filter; 1 MΩ / 1 MΩ start VCO_IN at half supply. A slide switch (`slide_switch_21`) connects VCO_IN either to that filter (loop closed) or to a manual potentiometer (`potentiometer_22`).
- Lock detector: PCP_OUT (high while comparator II rests) averaged by 10 kΩ and 220 nF, into an LM386 (`lm386_27`) through 100 kΩ; 220 kΩ from +9 V sets the − input. Its output lights a green LED (1 kΩ to ground) when locked, a red LED (1 kΩ from +9 V) when not.

## Observable behaviour
- Loop closed, astable inside the VCO's range: the loop rings for about 30 ms, then the VCO runs at the astable's frequency; green LED.
- Astable tuned below 532 Hz, the VCO's lowest frequency: the loop cannot follow; comparator II keeps pulling down against the start bias, the VCO wanders well above the astable, and the red LED lights.
- Manual position: the VCO runs wherever the manual pot puts it (682 Hz as built), whatever the astable does.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| setting | astable | VCO | lock detector |
|---|---|---|---|
| loop, as built, after 30 ms | 739 Hz | 741 Hz on average | 8.1 V, green |
| loop, tune pot at 0 | 397 Hz | 195 Hz above it | 0.9 V, red |
| manual, pot at 0.3 | 739 Hz | 683 Hz | — |

## What this verifies
1. A phase comparator and a filter close a loop around the VCO: the loop drives its control voltage until the VCO matches the input in frequency and phase. That is regulation; setting the VCO with a pot is mere control.
2. The loop can only follow inside the range the VCO can reach (its lock range); outside it the comparator keeps pushing and the lock indicator shows it.

## Simulation notes
A two-transistor astable is the most expensive part of this bench to simulate (each switching edge needs many tiny time steps), so the scenarios run for about 10 ms.

```assert
# t = 1 ms: VCO_IN on its way from the half-supply start; comparator reference
net lm386_27.inn V 1.667 +-0.01
net cd4046_12.r2 V 4.50 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 39** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-lock` prints them one by one.
<!-- engine-provenance -->
