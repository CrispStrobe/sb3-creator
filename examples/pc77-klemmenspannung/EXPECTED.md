# pc77-klemmenspannung — expected behaviour

## Circuit
Battery: EMF = 9 V, r_internal = 1 Ω. Load: 100 Ω. Also 470 Ω + red LED indicator.

## Meter readings (measured on the engine)
- **Total current:** I = 88.97 + 14.37 = 103.33 mA.
- **Voltage drop on internal R:** 0.10333 × 1 = 0.1033 V.
- **Terminal voltage:** V_t = 9 − 0.1033 = 8.8967 V.
- **Load current through the 100 Ω:** 8.8967 / 100 = 88.97 mA.
- **LED branch current:** (8.8967 − 2.1437) / 470 = 14.37 mA.
- **LED forward drop under this current:** 2.14 V.

## What this verifies
1. V_terminal = EMF − I × r_internal
2. Under load, terminal voltage is always less than EMF
3. Internal resistance is invisible to the eye but measurable with a meter
4. A diode in a branch is a voltage drop in series, so the branch current is
   (V_t − V_f) / R. The derivation this page carried until the engine could
   solve `rInternal` combined the indicator branch as `100 ∥ (470 + 2)`, adding
   a forward drop in volts to a resistance in ohms; every number above is now
   solved instead, and `docs/EXPECTED-CLAIM-CENSUS.md` records what moved.

```assert
# Battery with r_internal=1R: V_terminal = 9 - I*1 under load
net battery_1.pos V 8.89 +-0.20
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@1caf851` and `bw-circuit-ui@06c7ea7` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc77-klemmenspannung` prints them one by one.
<!-- engine-provenance -->
