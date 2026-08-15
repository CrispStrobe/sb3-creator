---
level: advanced
age: 14+
prereqs: [pc08-diode-polarity, pc02-voltage-divider]
teaches: [zener-diode, voltage-regulation, clamping]
---
## Was du siehst
Eine Zener-Diode klemmt die Spannung auf etwa 5,1 V, obwohl die Versorgung 9 V beträgt. Ein Vorwiderstand vernichtet die überschüssige Spannung, und die Zener-Diode hält eine stabile Referenz unabhängig von Laständerungen.

## Probier das
1. Klick auf **Sim** und lies die Spannung am Zener-Knoten — sie sollte bei etwa 5,1 V liegen.
2. Ändere die Versorgungsspannung von 9 V auf 12 V. Der Zener-Knoten bewegt sich kaum — das ist Regelung.
3. Verkleinere den Lastwiderstand. Mehr Strom fließt durch die Last, weniger durch die Zener-Diode, aber die Spannung bleibt gleich, bis die Zener-Diode keinen Stromvorrat mehr hat.

## Was passiert hier
Eine Zener-Diode ist dafür gebaut, in Sperrrichtung bei einer präzisen Spannung zu leiten — ihrer Durchbruchspannung. Unterhalb dieser Spannung sperrt sie wie jede Diode; darüber klemmt sie und hält die Spannung konstant. Der Vorwiderstand absorbiert die Differenz zwischen Versorgung und Zener-Spannung: (9 V − 5,1 V) / R = der Gesamtstrom, der sich zwischen Zener-Diode und Last aufteilt.

## Warum das wichtig ist
Zener-Referenzen sind die einfachsten Spannungsregler. Sie liefern eine stabile Spannung für Sensor-Arbeitspunkte, ADC-Referenzen und Schutzschaltungen. Zu verstehen, wie der Vorwiderstand mit der Zener-Diode zusammenspielt, ist der Schlüssel zum Design — zu hoch und die Zener-Diode verhungert unter Last, zu niedrig und sie überhitzt ohne Last.

## Weiter geht's
- [pc18-zener-clamp](../pc18-zener-clamp) — eine Zener-Diode als Überspannungsschutz.
- [pc37-selectable-reference](../pc37-selectable-reference) — Vergleich mit einer Widerstandsteiler-Referenz (keine Regelung).
- Experiment: Berechne den maximalen Laststrom, bevor die Zener-Diode aus der Regelung fällt.
