# pc75-alarmgeber — expected behaviour

## Circuit
Button in VCC line → 555 astable. R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF. Output → buzzer.

## Observable behaviour
- **Button released:** 555 unpowered. No sound. Buzzer silent.
- **Button pressed:** 555 powered, astable oscillates. f ≈ 686 Hz. Buzzer sounds.
- **Button released again:** instant silence (no stored energy in RC keeps it going).

## What this verifies
1. Button in power rail = momentary alarm
2. Same 555 astable tone as pc67 (~686 Hz)
3. No memory — alarm stops when button is released
