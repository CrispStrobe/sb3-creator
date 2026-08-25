# pc15-mini-npn — NPN switch on a mini breadboard

## Circuit
An NPN low-side switch on a 170-point mini breadboard (17 columns, no rails).
Base fed from the supply through 10 kΩ; collector load is 470 Ω + red LED;
emitter to the return.

Seating (all in the top block, rows a–e):

| part | lead | hole | column strip |
|---|---|---|---|
| R_base (10 kΩ) | a | a2 | col-t2 (+5 V) |
| R_base (10 kΩ) | b | a8 | col-t8 (base) |
| Q (NPN) | emitter | c7 | col-t7 (return) |
| Q (NPN) | base | c8 | col-t8 |
| Q (NPN) | collector | c9 | col-t9 |
| R_load (470 Ω) | a | b2 | col-t2 (+5 V) |
| R_load (470 Ω) | b | b12 | col-t12 |
| LED | anode | c12 | col-t12 |
| LED | cathode | d9 | col-t9 (collector) |

Supply leads tap **e2** (+5 V) and **e7** (return).

## Expected — physically
- V_be ≈ 0.70 V, so I_b = (5.0 − 0.70) / 10 000 ≈ **0.43 mA**.
- β · I_b = 43 mA is far more than the collector branch can supply: with the
  LED at ≈ 2 V and V_ce_sat ≈ 0.2 V, the 470 Ω load allows at most
  (5.0 − 2.0 − 0.2) / 470 ≈ **5.96 mA**. The transistor therefore runs
  **saturated** — hard on, LED lit at about 6 mA, collector pinned near
  0.2 V above the emitter.

## Measured on the engine

`audit-solve pc15-mini-npn` at t = 1 ms:

| node | volts |
|---|---|
| supply (col-t2) | 5.0000 |
| base (col-t8) | 0.7043 |
| collector (col-t9) | 0.2006 |
| LED anode (col-t12) | 2.2589 |
| emitter (col-t7) | 0.0000 |

NPN is saturated as expected: V_ce = 0.20 V, LED forward drop 2.06 V,
I_c = (5.0 − 2.26 − 0.20) / 470 = **5.40 mA**. The hand estimate of 5.96 mA
used ideal drops; the Shockley model raises them slightly, reducing the current
by about 10 % — the same pattern as every other LED example in the gallery.

```assert
# NPN saturated: Vbe ~ 0.70V, Vce ~ 0.20V
net vsource_2.pos V 5.00 +-0.01
net npn_5.base V 0.70 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@1caf851` and `bw-circuit-ui@06c7ea7` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc15-mini-npn` prints them one by one.
<!-- engine-provenance -->
