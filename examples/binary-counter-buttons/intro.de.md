---
level: beginner
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [binary, place-value, procedures]
---
## Was du siehst
Fünf LEDs zeigen eine Zahl von 0 bis 31 im Binärsystem. Drücke Hoch, um hochzuzählen, und Runter, um herunterzuzählen. Der serielle Monitor zeigt dieselbe Zahl im gewohnten Dezimalsystem, so kannst du jeden Schritt prüfen.

## Probier das
1. Starte das Programm und drücke fünfmal Hoch. Welche LEDs leuchten? Addiere ihre Stellenwerte: 4 + 1 = 5.
2. Zähle von 0 aus herunter. Die LEDs springen auf 31 — alle fünf an.
3. Überlege vor dem Drücken, wie 18 aussieht, dann zähle bis dahin und prüfe es.

## Was passiert hier
Jede LED ist doppelt so viel wert wie die rechts daneben: 1, 2, 4, 8, 16. Jede Zahl von 0 bis 31 ist genau eine Kombination davon. Die Prozedur `show value` findet diese Kombination so, wie du mit Münzen bezahlst: mit dem größten Stellenwert anfangen, ihn nehmen, wenn er passt, abziehen und mit dem Rest weitermachen.

Jeder Tastendruck zählt nur einmal, weil das Programm wartet, bis der Taster losgelassen ist, bevor es wieder nachsieht.

## Warum das wichtig ist
Alles in einem Computer wird so gespeichert — an und aus, 1 und 0, jede Stelle doppelt so viel wert wie die vorige. Fünf LEDs sind fünf Bits; ein Byte sind acht.

## Weiter geht's
- [20-shift-register-binary](../20-shift-register-binary) — ein Binärzähler über ein Schieberegister, mit weniger Pins.
- [dice-pips](../dice-pips) — eine andere Art, eine Zahl mit LEDs zu zeigen.
- Experiment: Füge einen dritten Taster hinzu, der den Wert auf 0 zurücksetzt.
