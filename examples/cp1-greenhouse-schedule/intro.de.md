---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Lüftungsplan fürs Gewächshaus

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Low-Impulse an P1.1 simulieren Minuten. P2.7 öffnet die Lüftung in Minute 2 und 6 und schließt in Minute 4 und 8. Der Plan endet nach Minute 9. Zwischen den Low-Impulsen den Eingang auf High freigeben.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
