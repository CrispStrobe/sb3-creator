---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Freie Werkstattplätze

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1-Byte 1 meldet eine Ankunft, 2 einen Abgang. Nach jedem Ereignis P1 auf 255 zurückstellen. Byte 0 beendet die Sitzung. Anfangs sind drei Plätze frei. Ankunft bei null und Abgang bei drei freien Plätzen bleiben wirkungslos.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
