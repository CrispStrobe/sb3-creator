---
level: beginner
age: 8+
prereqs: []
teaches: [voltage-divider, resistor-ratio]
---
## Was du siehst
Zwei Widerstaende in Reihe zwischen VCC und Masse, mit einem Messpunkt dazwischen. Die Spannung am Mittelpunkt ist ein Bruchteil der Versorgungsspannung, bestimmt durch das Widerstandsverhaeltnis. Keine aktiven Bauteile — nur passive Spannungsteilung.

## Probier das
1. Starte die Simulation und lies die Spannung am Mittelpunkt zwischen den beiden Widerstaenden ab.
2. Aendere den oberen Widerstand auf einen hoeheren Wert und beobachte, wie die Mittelpunktspannung sinkt.
3. Mache beide Widerstaende gleich gross und pruefe, ob der Mittelpunkt genau bei der halben Versorgungsspannung liegt.

## Was passiert hier
Ein Spannungsteiler verteilt die Versorgungsspannung proportional auf zwei Widerstaende. Die Ausgangsspannung ist Vout = VCC * R2 / (R1 + R2), wobei R2 der untere Widerstand ist. In dieser Schaltung wird kein Strom am Mittelpunkt entnommen, daher gilt die Formel exakt. Das ist der einfachste Weg, eine niedrigere Spannung als die Versorgung zu erzeugen, ohne einen Regler zu benoetigen.

## Warum das wichtig ist
Spannungsteiler tauchen ueberall auf — in Sensorschnittstellen, Rueckkopplungsnetzwerken und Pegelwandlern. Dieses Verhaeltnis zu verstehen ist der erste Schritt, um analoge Signale mit einem Mikrocontroller zu lesen.

## Weiter geht's
- [52-battery-voltage-divider](../52-battery-voltage-divider) — nutze einen Teiler, um eine Batteriespannung zu messen, die den Eingangsbereich des MCU ueberschreitet.
- [41-pot-as-dimmer](../41-pot-as-dimmer) — ersetze die festen Widerstaende durch ein Potentiometer fuer einen stufenlos einstellbaren Teiler.
- Experiment: Berechne die Widerstandswerte, die noetig sind, um aus 5 V genau 3,3 V zu erzeugen, und pruefe es in der Simulation.
