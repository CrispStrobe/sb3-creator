---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Schrankcode finden

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Über P1 ein Byte von 0 bis 254 raten, dazwischen 255 einstellen. P2 zeigt 1 für zu klein, 2 für zu groß, 3 für richtig und 4 nach zwölf Fehlversuchen. Attempts zählt die Versuche.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
