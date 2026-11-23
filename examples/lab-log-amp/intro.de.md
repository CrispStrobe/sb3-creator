# Logarithmierer mit einer Diode

Die Spannung an einer Diode wächst nicht proportional zum Strom, sondern mit dem Logarithmus des Stroms. Setzt man eine Diode in den Rückkopplungszweig eines Operationsverstärkers, wird der Ausgang zum Logarithmus des Eingangs. Verzehnfacht man den Eingang, steigt der Ausgang jedes Mal um denselben kleinen Schritt.

**Vermittelt:** die exponentielle Diodenkennlinie, analoges Rechnen, Logarithmen machen aus Multiplikation eine Addition

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf so, dass das Eingangs-Voltmeter etwa 0,09 V zeigt, dann 0,9 V, dann 9 V, und lies jedes Mal das Ausgangs-Messgerät ab.

## Was du sehen solltest

- 0,09 V am Eingang: etwa 4,73 V am Messgerät.
- 0,9 V am Eingang: etwa 5,33 V.
- 9 V am Eingang: etwa 5,92 V.
- Jeder Zehnerschritt bringt etwa 0,6 V dazu.

## Warum es funktioniert

Der Operationsverstärker schickt den Eingangsstrom durch die Diode zurück. Ein Siliziumübergang braucht für jede Verzehnfachung des Stroms etwa 60 mV mehr, also zählt die Diodenspannung, und mit ihr der Ausgang, Zehnerpotenzen statt Volt. Der zweite Operationsverstärker multipliziert nur mit zehn, damit das Messgerät gut ablesbar ist.
