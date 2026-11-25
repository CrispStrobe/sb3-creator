---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Drei Kopfrechenaufgaben

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Jede Runde zeigt zwei Summanden und wartet dann auf die Antwort an P1. Ohne Antwort und zwischen den Runden 255 einstellen. P2.1 meldet, ob die Antwort stimmt. Am Ende zeigt die Anzeige die Punktzahl von drei Aufgaben.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
