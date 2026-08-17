# 31-no-resistor-led — the series resistor lesson

## Circuit

Two paths side by side:
- **WRONG:** VCC → LED (red) → GND. No series resistor.
- **RIGHT:** VCC → 220 Ω → LED (green) → GND. With series resistor.

## Why this matters

On 5 V with no resistor, the LED forward voltage is 2.0 V and the remaining
3.0 V appears across the LED's dynamic resistance (~10–20 Ω), driving
I = 3.0 / 15 ≈ 200 mA — far beyond the LED's rated 20 mA. On a real bench
this is a dead LED within seconds.

With 220 Ω: I = (5.0 − 2.0) / 220 ≈ 13.6 mA — safely within the rating.

## Observable behaviour

| path | current | LED survives? |
|---|---|---|
| no resistor | ~200 mA (model-dependent) | **NO** — exceeds absolute maximum |
| 220 Ω | ~13.6 mA | yes — nominal operating current |

## What a good simulator should show

The no-resistor LED should either:
- Show a warning: "LED current exceeds maximum rating"
- Show excessive brightness (saturated) compared to the resistor-limited one
- Or both

A simulator that shows both LEDs as equally "on" is hiding the problem.

## What this verifies

1. The engine models current-limiting (or lack thereof)
2. The resistor-limited LED has reasonable brightness (~0.65)
3. The no-resistor LED has different (likely much higher) brightness

```assert
# Good LED (with R): anode at Shockley Vf ≈ 2.13V
net led_ok.anode V 2.13 +-0.15
```
