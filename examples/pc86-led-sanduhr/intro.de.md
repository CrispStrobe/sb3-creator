---
level: advanced
age: 14+
prereqs: [pc81-led-lauflicht]
teaches: [tilt-sensor, 555-timer, CD4017, hourglass, sequential-fill]
---
## Was du siehst
Eine LED-Sanduhr: sechs LEDs füllen sich nacheinander — wie Sandkörner, die fallen. Ein 555-Timer taktet den CD4017 mit ~1 Hz. Kippe den Neigungssensor und die Sanduhr setzt sich zurück — die LEDs erlöschen und das Füllen beginnt von vorn.

## Probier das
1. Klick auf **Sim** — die LEDs füllen sich eine pro Sekunde.
2. Nach sechs Sekunden sind alle an — die Sanduhr ist „voll".
3. Aktiviere den Neigungssensor (Sanduhr umdrehen) — alle LEDs erlöschen und es beginnt von vorn.

## Was passiert hier
Der 555 im Astable-Modus (R₁=10 kΩ, R₂=68 kΩ, C=10 µF → f ≈ 1 Hz) taktet den CD4017. Bei jedem Takt geht ein weiterer Ausgang auf High. Der Neigungssensor liegt am Reset-Pin des Zählers: Kippen setzt alle Ausgänge auf Low. Der Zähler zählt nur bis 5 (q6 löst den Reset aus).

## Weiter geht's
- [pc81-led-lauflicht](../pc81-led-lauflicht) — Lauflicht statt Auffüllung.
- [pc63-555-bistabil](../pc63-555-bistabil) — der Timer als Speicher.
