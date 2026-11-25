---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Aus dem Neun-Felder-Raster

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Die Felder sind zeilenweise von 0 bis 8 nummeriert. Start bei 0, Zielfeld an P1 wählen, dann auf 255 zurückstellen. Nur waagerechte und senkrechte Nachbarfelder sind erlaubt, Feld 4 ist gesperrt. Erreiche Feld 8. Die Anzeige zeigt gültige Züge.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
