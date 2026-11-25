---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Zwei flankengesteuerte Impulse

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1.6 zunächst auf High, dann auf Low ziehen. Das erzeugt an P2.4 einen Impuls von 200 Einheiten. Dauerhaftes Low löst keinen zweiten Impuls aus. Erst freigeben und erneut auf Low ziehen. Nach dem zweiten Impuls hält das Programm an.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
