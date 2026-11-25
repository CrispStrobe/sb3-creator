---
level: beginner
age: 10+
prereqs: [lab-astable-blinker]
teaches: [astable, feedback, signals]
---
## Was du siehst
Ein Zwei-Transistor-Blinker mit roter und grüner LED und vier Schaltern: **EN1** und **EN2** verbinden die Emitter der Transistoren, **HOLD** verbindet einen der beiden Koppelkondensatoren, **DARK** überbrückt die rote LED.

## Probier das
1. Klick auf **Sim**: Rot und Grün wechseln sich ab, beide blinken.
2. Schließ **DARK**: Nur Grün blinkt (die Schaltung läuft weiter, die rote LED ist nur überbrückt). Öffne ihn wieder.
3. Öffne **HOLD**: Das Blinken hört auf, beide LEDs bleiben an. Schließ ihn wieder.
4. Öffne **EN1**: Rot geht aus, Grün bleibt an.
5. Öffne auch **EN2**: beide aus. Schließ **EN1** wieder: Rot an, Grün aus.
6. Schließ alles: Beide blinken wieder. Fünf verschiedene Signale aus einer Schaltung.

## Was passiert hier
Jeder Transistor schaltet den anderen über einen Kondensator aus, und es dauert etwa eine Drittelsekunde, bis die andere Basis über ihre 47 kΩ nachgeladen ist. Nimm einen Kondensator weg (**HOLD**), und niemand schaltet mehr jemanden aus: Beide Basen bekommen Strom über ihre Widerstände, beide LEDs leuchten. Nimm einem Transistor die Emitterverbindung (**EN1**, **EN2**), dann kann diese Hälfte gar keinen Strom führen: Ihre LED ist dunkel, und der andere Transistor, den keiner mehr ausschaltet, bleibt an.

## Weiter geht's
- [lab-astable-blinker](../lab-astable-blinker) — der einfache Blinker.
