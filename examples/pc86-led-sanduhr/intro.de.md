---
level: advanced
age: 14+
prereqs: [pc81-led-lauflicht]
teaches: [tilt-sensor, 555-timer, CD4017, hourglass, sequential-fill]
---
## Was du siehst
Eine LED-Sanduhr: sechs LEDs füllen sich nacheinander — wie Sandkörner, die fallen. Ein 555-Timer taktet den CD4017 mit ~1 Hz. Bringe den Sensor in die waagerechte Lage, um die LEDs zu löschen. Erneutes Kippen startet das Füllen.

## Probier das
1. Klick auf **Sim** und kippe den Sensor. Pro Sekunde leuchtet eine weitere LED.
2. Nach sechs Sekunden sind alle an — die Sanduhr ist „voll".
3. Bringe den Sensor in die waagerechte Lage. Die LEDs bleiben aus, bis du ihn erneut kippst.

## Was passiert hier
Der 555 im Astable-Modus (R₁=10 kΩ, R₂=68 kΩ, C=10 µF → f ≈ 1 Hz) taktet den CD4017. Jeder Zustand von Q1 bis Q6 speist über die Diodenmatrix eine zusätzliche LED. Q7 setzt den Zähler auf Q0 zurück. Ein waagerechter Sensor hält den Zähler ebenfalls bei Q0, wo alle LEDs dunkel sind.

## Weiter geht's
- [pc81-led-lauflicht](../pc81-led-lauflicht) — Lauflicht statt Auffüllung.
- [pc63-555-bistabil](../pc63-555-bistabil) — der Timer als Speicher.
