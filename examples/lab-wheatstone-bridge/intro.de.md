---
level: intermediate
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [wheatstone-bridge, null-measurement, ratio]
---
## Was du siehst
Zwei Spannungsteiler nebeneinander, einer mit bekanntem und unbekanntem Widerstand, der andere ein Potentiometer. Zwischen ihren Mittelpunkten sitzt ein Messgerät.

## Probier das
1. Klick auf **Sim**. Das Messgerät zeigt eine Spannung.
2. Dreh das Potentiometer, bis das Messgerät null anzeigt. Merk dir die Stellung.
3. Rechne den unbekannten Widerstand aus: Stellung ÷ (1 − Stellung) × 10 kΩ.
4. Schalt auf den zweiten unbekannten Widerstand um und gleich erneut ab.
5. Ändere die Batteriespannung. Wandert die Null?

## Was passiert hier
Jeder Teiler gibt seinem Mittelpunkt einen Bruchteil der Versorgung. Sind beide Bruchteile gleich, liegt zwischen den Mittelpunkten keine Spannung und das Messgerät zeigt null — egal wie groß die Batteriespannung ist. Man muss also nie der Skala des Messgeräts trauen, nur seiner Null. Dehnungsmessstreifen, Waagen und viele Sensoren nutzen genau diese Brücke.

## Weiter geht's
- [pc02-voltage-divider](../pc02-voltage-divider) — ein einzelner Teiler.
