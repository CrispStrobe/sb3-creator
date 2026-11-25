---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Taster-Stoppuhr

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1.4 mit Masse verbinden, um Intervalle von 100 Einheiten zu zählen. Zum Anhalten den Kontakt öffnen und Count mit ACC ablesen. Bei neun endet die Zählung auch bei geschlossenem Kontakt.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
