---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator]
teaches: [555-timer, alarm, button-activated, buzzer]
---
## Was du siehst
Ein Alarmgeber: der Taster schaltet die Stromversorgung des 555-Timers ein, der Summer ertönt sofort. Loslassen → Stille.

## Probier das
1. Klick auf **Sim** — kein Ton (Timer ohne Strom).
2. Drücke den Taster — der Summer erzeugt einen Alarmton (~686 Hz).
3. Loslassen — sofort Stille.

## Was passiert hier
Der Taster liegt in der Versorgungsleitung des 555. Drücken verbindet VCC mit dem Timer, der sofort im astabilen Modus anschwingt und den Summer ansteuert. R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF → f ≈ 686 Hz.

## Weiter geht's
- [pc76-alarmschaltung](../pc76-alarmschaltung) — Alarm mit Speicher (Latch hält den Ton).
- [pc67-555-tongenerator](../pc67-555-tongenerator) — gleicher Tongenerator ohne Taster.
