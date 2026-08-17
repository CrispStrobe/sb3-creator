---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [and-logic, boolean-algebra, button-input]
---
## Was du siehst
Zwei Taster und eine LED. Die LED leuchtet nur, wenn beide Taster gleichzeitig gedrückt werden. Lässt man einen los, geht sie aus. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Drücke nur den linken Taster — die LED bleibt aus.
2. Drücke nur den rechten Taster — immer noch aus.
3. Drücke beide Taster gleichzeitig und die LED leuchtet auf.

## Was passiert hier
Das implementiert ein logisches UND-Gatter in Software. Der MCU liest zwei Eingangspins, einen pro Taster, und setzt den Ausgangspin nur dann auf HIGH, wenn beide Eingänge HIGH sind. In der Booleschen Algebra schreibt man das als Q = A UND B. Hardware-UND-Gatter funktionieren genauso in jedem Prozessor — dieses Projekt macht die unsichtbare Logik mit Tastern und einer LED sichtbar. Die Taster nutzen die quasi-bidirektionalen Eingänge des 8051, die im ungedrückten Zustand HIGH lesen und LOW, wenn der Taster den Pin mit Masse verbindet.

## Warum das wichtig ist
UND, ODER und NICHT sind die drei Grundbausteine aller Digitallogik. Jede Entscheidung, die ein Computer trifft — von „Ist dieses Pixel weiß?" bis „Soll dieses Triebwerk zünden?" — setzt sich aus diesen Grundoperationen zusammen. Sie mit echten Tastern zu verstehen, baut eine Intuition auf, die keine Wahrheitstabelle bieten kann.

## Weiter geht's
- [19-logic-or-gate](../19-logic-or-gate) — das ODER-Gatter als Gegenstück zu diesem UND-Gatter.
- [05-counter-7seg](../05-counter-7seg) — Tastereingabe mit einer komplexeren Ausgabe.
- Experiment: Füge einen dritten Taster hinzu und lasse die LED erst bei drei gedrückten Tastern leuchten — ein Drei-Eingang-UND-Gatter.
