---
level: advanced
age: 14+
prereqs: [lab-function-generator]
teaches: [integrator, op-amp, analog-memory, threshold-detector]
---
## Was du siehst
Ein Drehknopf, ein Operationsverstärker mit einem Kondensator vom Ausgang zurück zum Eingang, und zwei LEDs an den Enden: rot links, grün rechts. Die Ausgangsspannung ist eine Kugel auf einem Tisch, und der Knopf kippt den Tisch.

## Probier das
1. Klick auf **Sim**. Der Knopf steht in der Mitte: Der Tisch ist waagerecht, die Kugel (der Ausgang, etwa 4,5 V) bleibt liegen.
2. Dreh den Knopf ganz nach rechts. Die Kugel rollt los: Der Ausgang steigt gleichmäßig, bis der grüne Anschlag aufleuchtet.
3. Dreh ihn ganz nach links. Die Kugel rollt über den ganzen Tisch zurück bis zum roten Anschlag.
4. Stell den Knopf zurück in die Mitte, während sie rollt. Die Kugel bleibt stehen, wo sie gerade ist.
5. Kipp nur ein wenig: Die Kugel rollt langsam. Je schräger der Tisch, desto schneller.

## Was passiert hier
Der Knopf bestimmt nicht, wo die Kugel liegt, sondern wie schnell sie sich bewegt. Der Operationsverstärker hält seinen Minus-Eingang auf derselben Spannung wie den Plus-Eingang (halbe Betriebsspannung). Weicht der Knopf davon ab, fließt ein kleiner, gleichmäßiger Strom durch den 100-kΩ-Widerstand. Der kann nur in den Kondensator, der sich gleichmäßig auflädt, und der Ausgang läuft wie eine Rampe. Knopf in der Mitte: kein Strom, keine Änderung, der Kondensator merkt sich den Stand. Jeder Anschlag ist ein Transistor an einem Spannungsteiler, der erst durchschaltet, wenn die Kugel nahe an sein Ende kommt.

## Weiter geht's
- [lab-function-generator](../lab-function-generator) — ein Integrator, der an jedem Ende von selbst umkehrt.
- [lab-ramp-timer](../lab-ramp-timer) — dieselbe rollende Kugel als Uhr.
