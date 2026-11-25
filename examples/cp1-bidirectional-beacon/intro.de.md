---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Ziehen und Abtasten

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1.5 mit einem hochohmigen Tastkopf beobachten. Das Programm zieht ihn auf Low, liest P1.2 und gibt P1.5 nach 145 Warteeinheiten frei. Ein Massekontakt an P1.2 ergibt 000, ein offener Kontakt 001.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
