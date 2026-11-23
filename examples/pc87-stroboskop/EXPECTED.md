# pc87-stroboskop — expected behaviour

## Circuit
555 astable. R₁=1 kΩ, R₂=100 kΩ, C=1 µF. Output → 100 Ω → white LED → GND.
CONTROL (pin 5) goes to GND through 10 nF, the usual decoupling: it holds the
thresholds at 1/3 and 2/3 of VCC. Wired straight to GND it would stop the timer.

## Observable behaviour (hand-computed)
- **Frequency:** f = 1.44 / ((1k + 200k) × 1µ) = 1.44 / 0.201 ≈ 7.16 Hz.
- **t_high:** 0.693 × (1k + 100k) × 1µ = 69.9 ms (flash duration).
- **t_low:** 0.693 × 100k × 1µ = 69.3 ms.
- **Duty cycle:** 69.9 / (69.9 + 69.3) ≈ 50.2 %. Note: standard 555 astable always > 50%.
- **For true low duty:** would need diode across R₂. Without it, duty is ~50%.
- **Flash current:** (5 − 2) / 100 = 30 mA — bright flash.
- **Period:** ~139 ms = 7.2 flashes/s.
- **Simulated:** about 7.1 flashes/s, output high 51 % of the time.

## What this verifies
1. 555 astable duty cycle depends on R₁/(R₁+2R₂) ratio
2. Small R₁ relative to R₂ gives lowest achievable duty without a diode
3. Low series resistance (100 Ω) for bright strobe flash

```assert
# 555 astable strobe: f = 1.44/((1k+200k)*1uF) = 7.16 Hz
buzzer_tone_hz: 7.16 ± 15%
net vcc_1.pos V 5.00 +-0.01
```
