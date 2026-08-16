---
level: intermediate
age: 12+
prereqs: [pc77-klemmenspannung]
teaches: [shunt-resistor, current-measurement, Ohms-law, voltmeter]
---
## Was du siehst
Indirekte Strommessung: ein kleiner Shunt-Widerstand (1 Ω) liegt in Reihe mit der Last. Die Spannung über dem Shunt ist proportional zum Strom: V_shunt = I × R_shunt. I = V_shunt / 1 Ω.

## Probier das
1. Miss die Spannung über dem 1-Ω-Shunt.
2. Rechne: I = V_shunt / 1 Ω. Bei 9 V Batterie, 0,5 Ω Innenwiderstand, 470 Ω Last + 1 Ω Shunt: I = 9 / (0,5 + 470 + 1) ≈ 19,1 mA. V_shunt ≈ 19,1 mV.
3. Die LED zeigt, dass Strom fließt — der Shunt beeinflusst die Schaltung kaum (1 Ω << 470 Ω).

## Was passiert hier
Ein Shunt-Widerstand ist absichtlich klein, damit er den Stromkreis möglichst wenig beeinflusst. Statt eines Amperemeters (das den Kreis auftrennen müsste) misst man die Spannung am Shunt mit einem Voltmeter und rechnet den Strom aus. Dieses Prinzip nutzt jedes digitale Multimeter im Ampere-Bereich.

## Weiter geht's
- [pc77-klemmenspannung](../pc77-klemmenspannung) — Innenwiderstand der Batterie.
- [pc80-quellen-vergleich](../pc80-quellen-vergleich) — Spannungsquellen unter Last vergleichen.
