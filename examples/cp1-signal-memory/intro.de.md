---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Signalspeicher

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Mit offenem P1.2 starten und den Eingang dann auf Masse ziehen. Das Programm erzeugt vier Zustände durch Addition von drei modulo sieben, speichert sie indirekt und gibt sie mit 80 Warteeinheiten pro Zustand auf P2 aus.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
