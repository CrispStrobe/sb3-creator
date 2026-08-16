---
level: advanced
age: 14+
prereqs: [pc69-nand-inverter, pc06-rc-charge]
teaches: [Schmitt-trigger, hysteresis, clean-edges, RC-ramp]
---
## Was du siehst
Ein NAND-Gatter als Schmitt-Trigger: eine langsam steigende RC-Rampe am Eingang erzeugt trotzdem einen sauberen Schaltflanke am Ausgang. Die LED schaltet scharf um, obwohl die Eingangsspannung sanft ansteigt.

## Probier das
1. Klick auf **Sim** — die LED ist anfangs an (Eingang unter der Schaltschwelle).
2. Der Kondensator lädt sich langsam — nach der Zeitkonstante (R·C = 1 s) springt die LED ab.
3. Der Umschaltpunkt ist scharf, nicht gleitend.

## Was passiert hier
Ein realer Schmitt-Trigger (z.B. 74HC132) hat zwei Schwellen: ein oberes und ein unteres Schwellwert (Hysterese). Liegt die Eingangsspannung zwischen beiden, bleibt der Ausgang stabil — kein Flattern. Hier zeigt das NAND-Gatter den Effekt: trotz langsam steigender Spannung am RC-Glied schaltet der Ausgang sauber.

## Weiter geht's
- [pc06-rc-charge](../pc06-rc-charge) — die RC-Ladekurve am Eingang.
- [pc71-nand-entpreller](../pc71-nand-entpreller) — Prellunterdrückung durch Latch.
