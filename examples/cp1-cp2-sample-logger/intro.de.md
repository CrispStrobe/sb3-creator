---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-programming]
---
## Vier Messwerte auf Kassette

Monitor-ROM importieren, die CPU bis zur Bereitschaft starten und anhalten. Programmzellen laden, CPU ohne Reset fortsetzen und `000 PC RUN` eingeben.

CP3 einsetzen und CP2 an P1.7 und P1.8 anschließen. P3.8 dient als Low-aktiver Abtasttaster, P3.1 bis P3.6 liefern den Messwert. P3.7 auf Low halten und den Taster zwischen Messungen freigeben. Nach vier Messungen RecordA bis RecordD und Total im oberen Speicherbereich prüfen. CAS speichert den gesamten Speicher. Nach dem Löschen beim Neustart lädt CAL den gespeicherten Datenstrom. Danach die vier Werte und ihre Summe mit OUT prüfen. CAS und CAL sind Monitortasten nach dem Halt des Lehrprogramms.

Die Eingänge liegen unter **Instrumente → Schalter**. Offen bedeutet High, geschlossen Low. Der Schaltername verwendet die nullbasierte Pin-Nummer der Buchse. Anschluss 1 entspricht Bit 0.

Diese Schaltung enthält CP3.
