---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Festkommafilter mit Viertelschritt

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Vier vorzeichenlose Abtastwerte an P1 anlegen. Werte von 0 bis 63 stehen für Vierteleinheiten, größere werden auf 63 begrenzt. Das laufende Ergebnis ist abgerundet (3 × Vorgänger + Eingang) / 4, mit Startwert null. Die P2-Ausgabe für einen Impuls mit der für einen Sprung vergleichen. Das Programm gibt vier Werte mit je 150 Warteeinheiten aus.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
