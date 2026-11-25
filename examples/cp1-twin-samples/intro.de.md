---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Zwillingszähler

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1.2 auf Masse ziehen, um den ersten zyklischen Zähler festzuhalten. Danach den Kontakt öffnen und P1.5 auf Masse ziehen, um den zweiten Zähler festzuhalten. Beide zählen modulo fünf mit 45 Warteeinheiten. P2.5 ist nur bei gleichen Werten High.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
