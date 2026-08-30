# pc79-indirekte-strommessung — expected behaviour

## Circuit
Battery: EMF = 9 V, r_internal = 0.5 Ω. Series: 1 Ω shunt → 470 Ω load → red LED → return.

## Meter readings (measured on the engine)
- **Loop resistance outside the LED:** 0.5 + 1 + 470 = 471.5 Ω.
- **Current:** I = (8.9927 − 2.1454) / 471 = 14.54 mA.
- **Voltage drop on internal R:** 0.0145379 × 0.5 = 0.0073 V.
- **Terminal voltage:** V_t = 9 − 0.0073 = 8.9927 V.
- **Shunt voltage:** V_shunt = 0.014538 × 1 = 14.54 mV.
- **Load voltage:** V_load = 0.014538 × 470 = 6.833 V.
- **LED forward drop under this current:** 2.15 V.

## What this verifies
1. I = V_shunt / R_shunt — Ohm's law applied to current measurement
2. Small shunt minimizes circuit disturbance
3. Voltmeter across shunt replaces ammeter in series
4. The shunt's few millivolts are a thousandth of the loop, so inserting it
   changes the current it is there to report by less than the meter can read.

```assert
# 1R shunt: V_shunt = I * 1R ~ 14.5mV, battery with r_internal=0.5R
net battery_1.pos V 8.99 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@6571648` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc79-indirekte-strommessung` prints them one by one.
<!-- engine-provenance -->
