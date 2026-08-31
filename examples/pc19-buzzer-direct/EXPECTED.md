# pc19-buzzer-direct — buzzer straight from a battery

## Circuit
5 V → 100 Ω → buzzer → return. No MCU, no program: the buzzer is meant to be
an **active** type, the kind with its own oscillator inside, so connecting it to
DC is supposed to be all it takes.

## Expected — electrically (measured, `audit-solve pc19-buzzer-direct`)

| node | volts |
|---|---|
| supply / R top | 5.0000 |
| R bottom = buzzer + | **2.5000** |
| return | 0.0000 |

The engine models the buzzer as a fixed **100 Ω**, so it forms an exact half
divider with the series 100 Ω:

- I = 5.0 / (100 + 100) = **25 mA**
- 2.5 V across the buzzer, 2.5 V across the resistor.

Halve the series resistor to 47 Ω and the buzzer voltage rises to 3.4 V; that
part of the example behaves and is worth reading.

## Expected — audibly

`buzzerTone()` reports `{hz: 2400, on: true}` — the active buzzer's built-in
oscillator sounds continuously at its rated tone (default 2400 Hz) when powered
with DC above ~2 V. This is the correct behaviour for an active buzzer: it
has its own oscillator inside, so connecting it to DC is all it takes.

```assert
# 5V -> 100R -> buzzer(100R model): half divider, 2.5V at junction
net vsource_1.pos V 5.00 +-0.01
net resistor_2.b V 2.50 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@338ac5d` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc19-buzzer-direct` prints them one by one.
<!-- engine-provenance -->
