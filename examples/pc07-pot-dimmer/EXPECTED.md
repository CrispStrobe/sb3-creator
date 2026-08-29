# pc07-pot-dimmer

## Circuit
5V → potentiometer (1kΩ) wiper → 220Ω → LED → return.

## Expected

Measured on bw-board `88e9668` through `Circuit.fromJSON`; the pot position is
the only control, and every row below is one `setControl` away from the last.

| position | wiper | LED anode | LED current |
|---|---|---|---|
| 0.0 | 0.0050 V | 0.0050 V | 0.000 mA |
| 0.5 | 2.2380 V | 2.0074 V | 1.048 mA |
| 1.0 | 4.9821 V | 2.1297 V | 12.965 mA |

At mid-travel the wiper does **not** sit at 2.5 V. Looking back into it the
divider is a 2.5 V source behind 500 Ω || 500 Ω = 250 Ω, and the 220 Ω + LED
hanging off that is a comparable load, so the node is pulled down to 2.2380 V
and the LED gets 1.048 mA — a dim but visible glow. At full travel the pot is
out of the way and the branch is the plain 220 Ω one, at 12.965 mA.

That loading is the reason this bench uses a **1 kΩ** pot rather than the 10 kΩ
one a dimmer is usually drawn with. [41-pot-as-dimmer](../41-pot-as-dimmer) is
the same circuit at 10 kΩ, and there the source impedance is 2.5 kΩ against the
same 220 Ω load — mid-travel there delivers twelve times less current, and the
LED is effectively dark. Ten times the pot resistance is ten times the collapse,
and at 1 kΩ the knob still visibly dims.

## What this verifies

1. A potentiometer as a variable divider, driven from its wiper
2. That the wiper is a source with impedance, not a voltage — the load moves it
3. That the series resistor sets the current at full travel

```assert
# Supply rail: 5V source
net vsource_2.pos V 5.00 +-0.01
# Pot at its authored 50 %: the wiper sits BELOW the unloaded 2.5 V.
net potentiometer_3.wiper V 2.238 +-0.03
net led_5.anode V 2.007 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@4ae89b5` and `bw-circuit-ui@60fd117` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc07-pot-dimmer` prints them one by one.
<!-- engine-provenance -->
