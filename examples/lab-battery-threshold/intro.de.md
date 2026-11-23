---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider, pc05-npn-switch]
teaches: [voltage-divider, threshold, base-emitter-voltage]
---
## Was du siehst
Drei LEDs, jede hinter einem Transistor und einem Spannungsteiler. Je nach Batteriespannung leuchten keine, eine, zwei oder alle drei: leer, schwach, OK, voll.

## Probier das
1. Klick auf **Sim**. Bei 6 V leuchten Rot und Gelb.
2. Senk die Batteriespannung schrittweise. Welche LED geht zuerst aus?
3. Erhöh auf 9 V: alle drei.
4. Such die Spannung, bei der Grün gerade zu glimmen beginnt.

## Was passiert hier
Ein Transistor leitet erst, wenn seine Basis etwa 0,7 V über dem Emitter liegt. Der Teiler gibt der Basis einen festen Anteil der Batteriespannung. Ein kleinerer unterer Widerstand bedeutet einen kleineren Anteil, also braucht diese Stufe mehr Batteriespannung. Drei Teiler ergeben drei Schwellen — eine einfache Balkenanzeige ohne Mikrocontroller.

## Weiter geht's
- [pc02-voltage-divider](../pc02-voltage-divider) — der Teiler allein.
- [lab-window-comparator](../lab-window-comparator) — scharfe Schwellen mit Komparatoren.
