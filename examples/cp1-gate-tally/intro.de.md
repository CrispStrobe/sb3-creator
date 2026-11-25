---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Richtungszähler mit zwei Sensoren

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Die Low-aktiven Sensoren A an P1.1 und B an P1.2 nach jeder Aktivierung freigeben. A dann B erhöht den Zähler, B dann A senkt ihn, zwei gleiche Ereignisse bleiben wirkungslos. Der Zähler startet bei eins und bleibt zwischen 0 und 4. P1.3 allein auf Low beendet den Lauf.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
