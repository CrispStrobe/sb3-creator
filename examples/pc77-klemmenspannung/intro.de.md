---
level: intermediate
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [terminal-voltage, open-circuit, internal-resistance, battery]
---
## Was du siehst
Eine Batterie (9 V, Innenwiderstand 1 Ω) mit einem Lastwiderstand (100 Ω). Ohne Last liefert die Batterie ihre volle Leerlaufspannung. Unter Last fällt ein Teil der Spannung am Innenwiderstand ab — die Klemmenspannung ist niedriger als die Leerlaufspannung.

## Probier das
1. Miss die Spannung ohne Last: V = 9,0 V (Leerlaufspannung = EMK).
2. Schließe den 100-Ω-Lastwiderstand an. I = 9 / (1 + 100) ≈ 89 mA.
3. Die Klemmenspannung: V_klemme = 9 − I × r = 9 − 0,089 × 1 = 8,91 V.
4. Die „verlorenen" 0,09 V fallen am Innenwiderstand ab.

## Was passiert hier
Jede reale Spannungsquelle hat einen Innenwiderstand. Je mehr Strom fließt, desto mehr Spannung fällt intern ab: V_klemme = EMK − I × r_innen. Das Multimeter misst die Klemmenspannung, nicht die EMK. Nur ohne Last (I = 0) sind beide gleich.

## Weiter geht's
- [pc78-belastete-quelle](../pc78-belastete-quelle) — zwei verschiedene Lasten zeigen unterschiedliche Spannungseinbrüche.
- [pc79-indirekte-strommessung](../pc79-indirekte-strommessung) — Strom über einen Shunt-Widerstand messen.
