---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Stoppring mit sechs Lampen

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Stoppindex 0–5 an P1 einstellen. Das Lauflicht beginnt bei Index 4 und läuft im Uhrzeigersinn zum Ziel. Bei anderen Eingabewerten wartet das Programm auf einen gültigen Index. P2.1 bis P2.6 treiben den Ring.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
