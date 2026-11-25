---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Abstieg mit drei Bremsladungen

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

An P1 bedeutet 0 Rollen und 1 Bremsen, dazwischen jeweils 255 einstellen. Start bei Höhe 15, Tempo 2 und drei Bremsladungen. Rollen erhöht das Tempo, eine Ladung senkt es bis mindestens eins. Eine Landung mit Tempo eins oder zwei meldet 1, sonst 2.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
