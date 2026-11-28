# lab-pll-fsk — expected behaviour

## Circuit
- 9 V supply. Transmitter: a two-transistor astable (`npn_5`, `npn_6`; 1 kΩ collector resistors, 47 nF, 22 kΩ base resistors). The key (`button_11`) puts another 22 kΩ in parallel with one base resistor and raises the frequency from about 700 Hz to about 920 Hz: frequency-shift keying.
- Receiver: a 4046 (`cd4046_13`) as a phase-locked loop. The astable's collector drives SIG_IN, VCO_OUT drives COMP_IN; comparator II (PC2_OUT) drives the loop filter, 47 kΩ into VCO_IN with 100 kΩ and 22 nF to ground; 1 MΩ / 1 MΩ start the VCO near mid-range. VCO: R1 = 100 kΩ, R2 = 47 kΩ, C1 = 10 nF (532 to 1032 Hz).
- DEM_OUT (a copy of VCO_IN, 10 kΩ load) reaches an LM386 (`lm386_26`, pins 1 and 8 joined) through 470 kΩ with 100 nF to ground; 820 kΩ from +9 V sets the − input. Its output lights the yellow "1" LED (`led_28`, 1 kΩ to ground) or the green "0" LED (`led_30`, 1 kΩ from +9 V).

## Observable behaviour
- Key up: the loop locks onto the low tone, VCO_IN sits low, the "0" LED is lit.
- Key down: the loop follows to the high tone within a few milliseconds, VCO_IN rises, the "1" LED lights.
- Key released: back to "0".

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, 12 ms after each change.

| key | VCO (locked) | LED |
|---|---|---|
| up | 699.5 Hz | "0" |
| down | 917 Hz | "1" (1.91 V across it) |
| released | low tone | "0" |

## What this verifies
1. A PLL's control voltage is a measure of the input frequency: the loop has to raise it to follow a higher tone. That makes the PLL an FM demodulator.
2. Two tones for 0 and 1 (FSK) is how modems and early home computers stored data on cassette tape.

## Simulation notes
The astable and the locked loop together cost seconds of wall time per simulated millisecond, so the scenario keeps to 36 ms; real data would use shorter tones and a faster loop.

```assert
# t = 1 ms: the loop starts from the 1 MOhm bias, reference of the comparator
net lm386_26.inn V 0.517 +-0.01
net cd4046_13.r2 V 4.50 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-fsk` prints them one by one.
<!-- engine-provenance -->
