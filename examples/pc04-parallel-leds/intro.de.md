---
level: beginner
age: 10+
prereqs: [pc01-led-resistor]
teaches: [parallel-circuits, current-splitting]
---
## Was du siehst
Zwei LEDs, jede mit einem eigenen 1-kΩ-Widerstand, parallel an einer 5-V-Versorgung. Beide LEDs leuchten gleich hell.

## Probier das
1. Klick auf **Sim** und überprüfe, dass beide LEDs dieselbe Spannung und denselben Strom zeigen.
2. Ändere einen Widerstand auf 2,2 kΩ. Diese LED wird dunkler — aber die andere bleibt gleich.
3. Trenne einen Zweig ganz ab (setze seinen Widerstand auf einen sehr hohen Wert). Die verbleibende LED bleibt unbeeinflusst.

## Was passiert hier
In einer Parallelschaltung liegt an jedem Zweig die volle Versorgungsspannung an, und jeder Zweig führt seinen eigenen Strom unabhängig voneinander. Jede LED sieht (5 V − 2 V) / 1 kΩ ≈ 3 mA. Der Gesamtstrom aus der Versorgung ist die Summe aller Zweige: etwa 6 mA. Einen Zweig zu ändern beeinflusst die anderen nicht — das ist die definierende Eigenschaft von Parallelschaltungen.

## Warum das wichtig ist
Die meisten realen Schaltungen sind parallel: Jedes Gerät in deinem Haus ist parallel ans Stromnetz angeschlossen. Zu verstehen, dass jeder Zweig unabhängig ist, ist der Schlüssel zum Analysieren und Entwerfen von Schaltungen mit mehreren Verbrauchern.

## Weiter geht's
- [pc03-series-resistors](../pc03-series-resistors) — vergleiche mit einer Reihenschaltung, bei der sich der Strom aufteilt.
- [pc17-current-compare](../pc17-current-compare) — sieh, was passiert, wenn die Zweige sehr unterschiedliche Widerstände haben.
- Experiment: Füge einen dritten parallelen Zweig hinzu und sag den Gesamtstrom vorher, bevor du simulierst.
