---
level: intermediate
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [reference-voltage, loading, source-resistance]
---
## Was du siehst
Drei gleiche 10-kΩ-Widerstände teilen eine 9-V-Versorgung in drei gleiche Stufen: 6 V, 3 V und 0 V. Ein Schalter verbindet eine 100-kΩ-Messlast mit dem oberen 6-V-Abgriff.

## Probier das
1. Klick auf **Sim** bei offenem Schalter. Lies die beiden Abgriffsspannungen: 6,000 V und 3,000 V — genau ein Drittel und zwei Drittel der Versorgung.
2. Schließe den Schalter. Der obere Abgriff fällt auf 5,625 V — die Last zieht ihn herunter, obwohl 100 kΩ nach einer leichten Last klingt.
3. Ändere den Lastwiderstand auf 10 kΩ und beobachte, wie der Abgriff viel stärker absackt.

## Was passiert hier
Ein Widerstandsteiler ist nur dann eine gute Spannungsreferenz, wenn nichts Strom daraus zieht. Sobald eine Last angeschlossen wird, bildet sie einen zweiten Teiler mit dem Innenwiderstand des Abgriffs. Hier beträgt der Innenwiderstand am oberen Abgriff 10 kΩ ∥ 20 kΩ = 6,67 kΩ, sodass selbst eine 100-kΩ-Last die Spannung um 6,25 % herabzieht. Die Abhilfe ist entweder ein niedrigerer Teilerwiderstand (mehr Verluststrom) oder ein Pufferverstärker.

## Warum das wichtig ist
Sensorschaltungen, ADC-Referenzen und Arbeitspunktnetzwerke basieren alle auf Spannungsabgriffen. Wenn man die Belastung nicht berücksichtigt, sind die Messwerte systematisch falsch — und der Fehler hängt davon ab, was angeschlossen ist, was das Debuggen erschwert.

## Weiter geht's
- [pc02-voltage-divider](../pc02-voltage-divider) — die Zwei-Widerstands-Version ohne Last.
- [pc40-opamp-threshold](../pc40-opamp-threshold) — ein Operationsverstärker puffert eine Referenzspannung.
- Experiment: Berechne den Lastwiderstand, der den Abgriff auf genau 5,0 V herabzieht.
