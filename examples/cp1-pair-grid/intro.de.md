---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Gedächtnisraster mit sechs Karten

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Kartenindizes 0–5 an P1 wählen und dazwischen 255 einstellen. Die Anzeige deckt den Kartenwert auf. P2.1 meldet, ob zwei verschiedene Karten zusammenpassen. Gefundene Paare werden entfernt. Nach drei Paaren hält das Programm an.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
