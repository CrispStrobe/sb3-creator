---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge]
teaches: [bleeder-resistor, capacitor-discharge, standby-power]
---
## Was du siehst
Ein Kondensator wird über einen Widerstand geladen, mit einem Entladewiderstand (Bleeder) parallel dazu. Der Bleeder entlädt den Kondensator langsam nach dem Abschalten der Versorgung und macht die Schaltung sicher zum Anfassen.

## Probier das
1. Klick auf **Sim** und beobachte, wie sich der Kondensator über einige Sekunden auflädt.
2. Beachte, dass das Laden langsamer ist als bei einer einfachen RC-Schaltung — der Bleeder zieht auch während des Ladens Strom.
3. Stelle dir vor, die Versorgung wird abgetrennt. Der Bleeder würde dann den Kondensator über sich selbst entladen.

## Was passiert hier
Der Entladewiderstand hat zwei Aufgaben: Er zieht einen kleinen, konstanten Strom, der die Versorgungsspannung stabilisiert, und nach dem Ausschalten bietet er dem Kondensator einen Entladepfad. Ohne Bleeder kann ein großer Kondensator eine gefährliche Ladung minutenlang oder stundenlang halten. Der Kompromiss ist Standby-Leistung — ein kleinerer Bleeder entlädt schneller, verschwendet aber mehr Energie im Betrieb.

## Warum das wichtig ist
Jedes Netzteil mit Filterkondensatoren braucht einen Bleeder für die Sicherheit. Fernsehtechniker lernen das auf die harte Tour — die Filterkondensatoren einer Bildröhre können hunderte Volt halten, lange nachdem das Gerät ausgesteckt ist. Bleeder sind in vielen Konsumprodukten auch durch Sicherheitsnormen vorgeschrieben.

## Weiter geht's
- [pc29-capacitor-discharge](../pc29-capacitor-discharge) — beobachte eine einfache Kondensatorentladung.
- [pc06-rc-charge](../pc06-rc-charge) — die grundlegende RC-Ladekurve.
- Experiment: Berechne die Entladezeitkonstante mit dem Bleeder-Wert und sage vorher, wie lange der Kondensator braucht, um unter 1 V zu fallen.
