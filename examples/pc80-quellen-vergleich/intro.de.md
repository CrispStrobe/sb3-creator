---
level: intermediate
age: 12+
prereqs: [pc77-klemmenspannung, pc78-belastete-quelle]
teaches: [internal-resistance, battery-comparison, voltage-source, loaded]
---
## Was du siehst
Zwei Batterien mit gleicher Nennspannung (9 V) aber unterschiedlichem Innenwiderstand: eine mit 0,5 Ω (z.B. Alkaline), eine mit 5 Ω (z.B. alte oder billige Batterie). Beide treiben identische Lastkreise (470 Ω + LED).

## Probier das
1. Vergleiche die LED-Helligkeit: die Batterie mit niedrigem Innenwiderstand (grüne LED) leuchtet heller.
2. Rechne: I₁ = 9 / (0,5 + 470) ≈ 19,1 mA, V_LED1 ≈ 8,99 V − V_f.
3. I₂ = 9 / (5 + 470) ≈ 18,9 mA, V_LED2 ≈ 8,91 V − V_f.
4. Der Unterschied ist klein bei dieser leichten Last — bei schwerer Last wäre er drastisch.

## Was passiert hier
Gleiche Nennspannung bedeutet nicht gleiche Leistungsfähigkeit. Der Innenwiderstand bestimmt, wie viel Spannung unter Last verloren geht. Eine Batterie mit hohem Innenwiderstand „bricht ein" — die Klemmenspannung sinkt, die LED wird dunkler.

## Weiter geht's
- [pc77-klemmenspannung](../pc77-klemmenspannung) — Leerlauf- vs Klemmenspannung erklärt.
- [pc79-indirekte-strommessung](../pc79-indirekte-strommessung) — den tatsächlichen Strom messen.
