---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [zener-diode, voltage-clamping, overvoltage-protection]
---
## Was du siehst
Eine Zener-Diode in Sperrrichtung parallel zur Last, mit einem Vorwiderstand von der Versorgung. Eine LED zeigt die begrenzte Ausgangsspannung. Egal wie hoch die Eingangsspannung steigt, die Zener-Diode haelt den Ausgang auf ihrer Nennspannung — sie wirkt als Obergrenze.

## Probier das
1. Starte die Simulation und notiere die Spannung ueber Zener-Diode und LED.
2. Erhoehe die Versorgungsspannung und beobachte, dass der Ausgang auf der Zener-Spannung begrenzt bleibt.
3. Senke die Versorgung unter die Zener-Spannung und beobachte, wie die Zener-Diode aufhoert zu leiten — sie begrenzt nur, wenn die Spannung ihre Nennspannung ueberschreitet.

## Was passiert hier
Eine Zener-Diode ist so konstruiert, dass sie bei einer bestimmten Durchbruchspannung in Sperrrichtung leitet. Der Vorwiderstand nimmt die ueberschuessige Spannung auf und begrenzt den Strom durch die Zener-Diode. Solange die Versorgung ueber der Zener-Spannung liegt, begrenzt die Diode den Ausgang auf einen stabilen Wert. Die LED leuchtet bei dieser begrenzten Spannung und bestaetigt die Regelung visuell. Das ist eine der einfachsten Spannungsregeltechniken.

## Warum das wichtig ist
Ueberspannungsschutz ist in jedem System wichtig, bei dem die Eingangsspannung unsicher ist. Zener-Begrenzungen schuetzen empfindliche Bauteile — MCU-Eingaenge, Sensorleitungen, Kommunikationsbusse — vor Spitzen, die sie zerstoeren wuerden.

## Weiter geht's
- [52-battery-voltage-divider](../52-battery-voltage-divider) — kombiniere einen Spannungsteiler mit Begrenzung fuer sichere Batteriemessung.
- [42-diode-rectifier](../42-diode-rectifier) — sieh, wie sich eine normale Diode anders als eine Zener-Diode verhaelt.
- Experiment: Ersetze die Zener-Diode durch eine mit anderer Nennspannung und sage die neue Ausgangsspannung vorher, bevor du die Simulation startest.
