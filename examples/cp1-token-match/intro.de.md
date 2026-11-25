---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Spiel mit zehn Marken

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Mit P1-Byte 1, 2 oder 3 so viele Marken nehmen. Zwischen den Zügen 255 einstellen. Der Computer ergänzt jeden Zug möglichst auf vier, nimmt aber höchstens den Rest. Ergebnis 1 bedeutet Spielersieg, 2 Computersieg.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
