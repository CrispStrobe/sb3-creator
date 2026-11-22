---
level: advanced
age: 14+
prereqs: [lab-window-comparator, pc92-and-or-xor-compared]
teaches: [adc, flash-converter, quantisation, logic-gates]
---
## Was du siehst
Ein Potentiometer, drei Komparatoren, drei Logikbausteine und zwei LEDs. Die LEDs zeigen die Reglerstellung als zweistellige Binärzahl.

## Probier das
1. Klick auf **Sim**. Die LEDs zeigen 1 0 (binär für 2).
2. Dreh das Potentiometer von einem Ende zum anderen. Die LEDs zählen 00, 01, 10, 11.
3. Dreh ein wenig innerhalb einer Stufe. Ändert sich der Code?

## Was passiert hier
Eine Widerstandskette erzeugt drei Vergleichsspannungen. Jeder Komparator meldet „mein Eingang liegt über meiner Vergleichsspannung". Zusammen bilden sie ein Thermometer: Je mehr Komparatoren hoch sind, desto höher die Spannung. Drei Gatter übersetzen das Thermometer in Binär: Der mittlere Komparator ist das hohe Bit, das niedrige Bit leuchtet bei „nur der erste" oder „alle drei". Der ADC eines Mikrocontrollers macht dasselbe mit mehr Bits.

## Weiter geht's
- [lab-2bit-dac](../lab-2bit-dac) — die Gegenrichtung.
- [lab-window-comparator](../lab-window-comparator) — zwei Schwellen, mit UND verknüpft.
