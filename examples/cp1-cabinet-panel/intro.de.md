---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Schalttafel mit Eingabefolge

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1 überträgt einen Tastencode, 255 bedeutet freigegeben. Die Folge 9, 4, 7 schaltet das Modellschloss an P2.3 frei. Eine falsche Taste setzt die Folge zurück. Die Anzeige zählt die richtigen Tasten in Folge.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
