---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Nutzungszähler

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Über P1 meldet 1 einen Standardtakt (7 Einheiten) und 2 einen Hochtariftakt (11 Einheiten). Dazwischen 255 einstellen. 0 beendet vorzeitig, nach acht gültigen Takten endet das Programm ebenfalls. Used und Cost prüfen.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
