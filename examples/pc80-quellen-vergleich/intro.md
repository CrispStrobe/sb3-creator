---
level: intermediate
age: 12+
prereqs: [pc77-klemmenspannung, pc78-belastete-quelle]
teaches: [internal-resistance, battery-comparison, voltage-source, loaded]
---
## What you see
Two batteries with the same nominal voltage (9 V) but different internal resistances: one with 0.5 Ω (e.g. alkaline), one with 5 Ω (e.g. old or cheap battery). Both drive identical load circuits (470 Ω + LED).

## Try this
1. Compare LED brightness: the battery with low internal resistance (green LED) shines brighter.
2. Calculate: I₁ = 9 / (0.5 + 470) ≈ 19.1 mA, V_LED1 ≈ 8.99 V − V_f.
3. I₂ = 9 / (5 + 470) ≈ 18.9 mA, V_LED2 ≈ 8.91 V − V_f.
4. The difference is small at this light load — at heavy loads it would be dramatic.

## What is going on
Same nominal voltage does not mean same capability. The internal resistance determines how much voltage is lost under load. A battery with high internal resistance "sags" — the terminal voltage drops and the LED dims.

## Go further
- [pc77-klemmenspannung](../pc77-klemmenspannung) — open-circuit vs terminal voltage explained.
- [pc79-indirekte-strommessung](../pc79-indirekte-strommessung) — measuring the actual current.
