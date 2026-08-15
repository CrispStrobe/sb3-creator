---
level: beginner
age: 8+
prereqs: [18-logic-and-gate]
teaches: [or-logic, boolean-algebra]
---
## Was du siehst
Zwei Taster und eine LED. Die LED leuchtet, wenn einer der beiden Taster gedrückt wird — oder wenn beide gedrückt sind. Sie geht nur aus, wenn keiner gedrückt ist.

## Probier das
1. Drücke nur den linken Taster — die LED leuchtet.
2. Drücke nur den rechten Taster — die LED leuchtet auch.
3. Lass beide los und die LED geht aus. Drücke beide zusammen — sie ist wieder an.

## Was passiert hier
Das implementiert ein logisches ODER-Gatter in Software. Der MCU liest zwei Eingangspins und setzt den Ausgang auf HIGH, wenn mindestens ein Eingang HIGH ist. In der Booleschen Algebra schreibt man Q = A ODER B. Vergleiche das mit dem UND-Gatter: UND braucht beide, ODER braucht mindestens einen. Zusammen mit NICHT können diese drei Operationen jede digitale Schaltung aufbauen — vom Addierer bis zum kompletten Prozessor. Der Unterschied zwischen UND und ODER ist nur ein Wort im Code, ändert aber das Verhalten komplett.

## Warum das wichtig ist
ODER-Logik begegnet dir überall: Ein Laptop wacht auf, wenn du den Einschaltknopf drückst ODER den Deckel öffnest. Ein Alarm wird ausgelöst, wenn die Tür aufgeht ODER das Fenster eingeschlagen wird. Zu sehen, wie ein einziges Wort in einer Bedingung das gesamte Verhalten ändert, baut ein tiefes Verständnis dafür auf, wie digitale Systeme Entscheidungen treffen.

## Weiter geht's
- [18-logic-and-gate](../18-logic-and-gate) — das UND-Gatter zum direkten Vergleich.
- [20-shift-register-binary](../20-shift-register-binary) — Logikgatter kombinieren, um einen Zähler zu bauen.
- Experiment: Implementiere XOR — die LED ist an, wenn genau ein Taster gedrückt ist, aber aus, wenn beide oder keiner gedrückt sind.
