---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Fliesenzahl in zwei Bytes

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Neun Pakete zu je 73 zählen. High und Low sind zwei Zahlenzellen zur Basis 256. Vor einem Additionsüberlauf zieht das Programm den passenden Betrag ab und erhöht High. Ergebnis: 2 × 256 + 145 = 657.
