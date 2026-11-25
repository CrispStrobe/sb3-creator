---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Kalibrierte Messanzeige

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Einen vorzeichenlosen ADC-Wert an P1 einstellen. Bis einschließlich 12 bleibt die Anzeige null, darüber entsprechen vier Schritte einem Zehntelvolt. Das Programm zieht den Offset ab, teilt durch vier und speichert Zehntelvolt in Reading.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
