---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Uhr zum Schichtwechsel

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Start bei 23:58. Ein Low-Impuls an P1.1 schaltet eine Minute weiter. Zwischen den Impulsen freigeben. P2 zeigt die Stunde, die Anzeige die Minute. P1.2 allein auf Masse beendet den Lauf. Drei Impulse führen über Mitternacht zu 00:01.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
