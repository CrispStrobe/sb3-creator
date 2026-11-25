---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Fahrstraßenwahl im Modellbahnhof

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1-Code 0 oder 1 fordert Fahrstraße A oder B an, 2 setzt beide Signale auf Halt und 3 setzt Halt und beendet das Programm. Dazwischen 255 einstellen. P2.1 stellt die Weiche, P2.2 und P2.3 geben die Fahrstraßen frei. Vor der Bewegung beide Signale auf Halt setzen und vor der Freigabe 120 Einheiten warten.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
