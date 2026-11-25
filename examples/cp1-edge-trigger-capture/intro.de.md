---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Flankenspeicher für fünf Abtastwerte

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

P1 ungefähr alle 56 ms digital abtasten lassen. P1.8 ist der Trigger. Den Eingang mindestens zwei Abtastwerte lang auf Low halten, dann auf High setzen. BeforeA, BeforeB, Trigger, AfterA und AfterB der Reihe nach prüfen. Gespeichert werden vollständige Bytes einschließlich Triggerbit. P2.1 markiert die Aufnahme.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
