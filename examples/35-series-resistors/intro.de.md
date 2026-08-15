---
level: beginner
age: 8+
prereqs: [34-ohms-law]
teaches: [series-resistance, voltage-drop]
---

## Was du siehst

Zwei Widerstaende sind in Reihe mit einer LED geschaltet. Der Gesamtwiderstand
ist die Summe beider Widerstaende, und der Strom durch die Schaltung wird von
diesem Gesamtwert bestimmt. Spannungsmessungen zeigen, wie sich die
Versorgungsspannung auf die beiden Widerstaende und die LED aufteilt.

## Probier das aus

1. Klick auf **Sim** und lies die Spannung ueber jedem Widerstand und den Strom
   durch die Schaltung ab.
2. Addiere die beiden Widerstandsspannungen und die LED-Spannung. Die Summe
   sollte gleich der Versorgungsspannung sein -- das ist die Kirchhoffsche
   Maschenregel.
3. Ersetze die beiden Widerstaende durch einen einzigen, dessen Wert gleich
   ihrer Summe ist. Der Strom sollte genau derselbe sein.

## Was passiert hier

Widerstaende in Reihe addieren sich. Ein 220-Ohm- und ein 330-Ohm-Widerstand in
Reihe verhalten sich genau wie ein einzelner 550-Ohm-Widerstand. Der Strom ist
in jedem Abschnitt einer Reihenschaltung gleich -- es gibt nur einen Weg, den er
nehmen kann. Die Spannung teilt sich im Verhaeltnis der Widerstandswerte auf:
Der groessere Widerstand bekommt den groesseren Anteil der Spannung. Das ist die
Kirchhoffsche Maschenregel: Die Summe aller Spannungsabfaelle in einer
geschlossenen Masche ist gleich der Versorgungsspannung.

## Warum das wichtig ist

Reihenwiderstand ist die Methode, um den Strom fein abzustimmen, wenn man nicht
den exakten Widerstandswert zur Hand hat. Auf dem gleichen Prinzip beruhen
Spannungsteiler, Sensorauswertung und jede Widerstandsleiter-DAC-Stufe.

## Weiter geht's

- **Wo das anfaengt:** [34-ohms-law](../34-ohms-law) -- das Ohmsche Gesetz mit
  einem einzelnen Widerstand.
- **Parallel statt in Reihe:**
  [22-series-parallel](../22-series-parallel) -- was sich aendert, wenn
  Widerstaende an denselben beiden Knoten liegen, statt hintereinander
  geschaltet zu sein.
- **Zum Ausprobieren:** Verwende drei gleich grosse Widerstaende in Reihe. Sag
  vorher, dass ueber jedem genau ein Drittel der verbleibenden Spannung (nach
  dem LED-Abfall) abfaellt. Simuliere und pruefe nach.
