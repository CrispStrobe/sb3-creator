---
level: intermediate
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, diode, timbre, sound]
---
## Was du siehst
Ein Transistor-Tongenerator mit einer Taste und einer Germaniumdiode in einem seiner beiden Koppelwege. Der Schalter **PLAIN** überbrückt die Diode.

## Probier das
1. Klick auf **Sim** und halte die Taste: ein tiefer Hupton.
2. Öffne **PLAIN**, damit die Diode im Weg liegt, und halte die Taste wieder: Der Ton ändert sich; er ist etwas höher und klingt anders.
3. Schalte hin und her, während du die Taste hältst, und vergleiche.

## Was passiert hier
Ein Koppelkondensator gibt die Schaltflanken normalerweise in beide Richtungen weiter: Er zieht die Basis des nächsten Transistors hinunter und wird wieder hochgeschoben, wenn die Stufe zurückschaltet. Eine Diode lässt Strom nur in eine Richtung durch. Mit der Diode im Weg kann der Kondensator die Basis noch hinunterziehen, aber nicht mehr über die Basis zurückgeschoben werden; ein 47-kΩ-Widerstand entlädt ihn stattdessen, und bis zur nächsten Flanke nur teilweise. Diese Hälfte jedes Takts wird kürzer: Der Ton steigt, und der Hörer ist einen größeren Teil jedes Takts eingeschaltet, was die Klangfarbe ändert, nicht nur die Tonhöhe.

## Weiter geht's
- [lab-astable-tone](../lab-astable-tone) — der einfache Oszillator.
