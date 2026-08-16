---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, low-duty-cycle, strobe, flash]
---
## What you see
A strobe light: a bright white LED flashes briefly, then stays dark for a long time. The 555 in astable mode produces a signal with a very low duty cycle — short HIGH pulse, long LOW phase.

## Try this
1. Click **Sim** — the LED flashes rhythmically.
2. R₁ = 1 kΩ (short charge time → short flash), R₂ = 100 kΩ (long discharge time → long pause).
3. Duty cycle ≈ (R₁)/(R₁+2·R₂) ≈ 0.5% — the LED is dark 99.5% of the time.

## What is going on
In a normal 555 astable, R₁+R₂ charge the capacitor (HIGH phase), R₂ alone discharges it (LOW phase). When R₁ << R₂, the charge time is much shorter than the discharge time — a narrow HIGH pulse results. The 100 Ω series resistor gives a bright flash (I ≈ 30 mA during the pulse).

## Go further
- [pc67-555-tongenerator](../pc67-555-tongenerator) — 555 astable in the audio range.
- [51-555-astable](../51-555-astable) — more symmetric blinking.
