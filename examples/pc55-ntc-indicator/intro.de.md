---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [ntc-thermistor, temperature-sensing, indicator]
---
## Was du siehst
Ein NTC-Thermistor in einem Spannungsteiler treibt eine LED-Anzeige. Wenn die Temperatur steigt, sinkt der Widerstand des Thermistors, die Teilerspannung aendert sich und die LED reagiert — heller bei Waerme, dunkler bei Kaelte.

## Probier das
1. Starte die Simulation bei Raumtemperatur und notiere die LED-Helligkeit und die Teilerspannung.
2. Erhoehe die Temperatur und beobachte, wie die LED heller wird, wenn der NTC-Widerstand sinkt.
3. Senke die Temperatur und beobachte, wie die LED dunkler wird, wenn der NTC-Widerstand steigt.

## Was passiert hier
Ein NTC-Thermistor (Negativer Temperaturkoeffizient) ist ein Widerstand, dessen Widerstandswert mit steigender Temperatur sinkt. In einem Spannungsteiler mit einem festen Widerstand verschiebt sich die Spannung am Mittelpunkt mit der Temperatur. Wenn der NTC kalt ist, ist sein Widerstand hoch, die Mittelpunktspannung niedrig und es fliesst wenig Strom durch die LED. Wenn er sich erwaermt, sinkt der Widerstand, die Mittelpunktspannung steigt und die LED leuchtet heller. Kein Mikrocontroller noetig — die Physik erledigt die Messung direkt.

## Warum das wichtig ist
Temperatur ist eine der am haeufigsten gemessenen Groessen in der Elektronik. NTC-Thermistoren sind guenstig, zuverlaessig und einfach mit einem Spannungsteiler auszulesen. Sie finden sich in Thermostaten, Ladegeraeten und Ueberstromschutzschaltungen, wo die Temperatur ueber das weitere Verhalten entscheidet.

## Weiter geht's
- [pc02-voltage-divider](../pc02-voltage-divider) — das Spannungsteilerprinzip, auf dem diese Schaltung basiert.
- [pc54-opamp-follower](../pc54-opamp-follower) — den Teilerausgang puffern fuer eine genauere Messung.
- Experiment: Tausche NTC und Festwiderstand im Teiler und sage vorher, wie sich das LED-Verhalten mit der Temperatur umkehrt.
