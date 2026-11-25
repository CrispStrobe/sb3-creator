---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Serieller Empfänger mit Quittung

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

Die drei Signalleitungen wie in serial-transmit verbinden. Diese Platine zuerst starten. Sie liest bei Low am Takt, quittiert jedes Bit an P2.3 und gibt die Leitung nach High am Takt frei. Nach acht Datenbits und einem geraden Paritätsbit bedeutet Valid gleich 1 gültig oder 0 Paritätsfehler. Die Anzeige zeigt das angenommene Byte oder null. Parität erkennt eine ungerade Zahl veränderter Bits.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.
