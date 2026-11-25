---
level: beginner
age: 10+
prereqs: [lab-rtl-gates]
teaches: [logic, and, transistor]
---
## Was du siehst
Zwei Transistoren übereinander in Reihe unter einer roten LED, jeder mit seinem eigenen Taster: **A** und **B**.

## Probier das
1. Klick auf **Sim**: Die LED ist dunkel.
2. Halte nur **A**: immer noch dunkel. Halte nur **B**: auch dunkel.
3. Halte **A** und **B** zusammen: Die LED leuchtet.

## Was passiert hier
Der Strom der LED muss durch beide Transistoren hintereinander, um zur Masse zu kommen. Jeder Taster gibt seinem Transistor über 10 kΩ Basisstrom und schaltet ihn ein. Ein einziger gesperrter Transistor in der Kette genügt, um den Strom aufzuhalten: Die LED leuchtet nur, wenn A UND B gedrückt sind. Das ist ein UND-Gatter aus zwei Transistoren.

## Weiter geht's
- [lab-rtl-gates](../lab-rtl-gates) — weitere Logikgatter aus Transistoren und Widerständen.
