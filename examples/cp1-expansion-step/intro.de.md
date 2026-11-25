---
level: advanced
age: 11+
prereqs: [cp1-first-display]
teaches: [single-step, cp3-memory, expansion-ports]
---
## Erweiterung im Einzelschritt

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Die Schaltung enthält CP3. Stelle das Byte über die P3-Eingänge ein und prüfe P4 und P5 in der Portansicht.

CP3 anschließen und an P3 `0xB6` anlegen (High an den Anschlüssen 2, 3, 5, 6 und 8, Low an den übrigen). Programm in den oberen Speicherbereich laden und `196 PC` eingeben. Fünfmal **STEP** drücken und jeweils die Tabelle prüfen. Belegt sind die Zellen 196–200 und 212 im Erweiterungsspeicher. Jeder Schritt führt einen Befehl ohne programmierte Wartezeit aus.

| STEP | PC | Expected result / Erwartetes Ergebnis |
| --- | --- | --- |
| 1 | 197 | ACC `A00.182` |
| 2 | 198 | Cell / Zelle 212 `00.182` |
| 3 | 199 | P4 `0xB6` |
| 4 | 200 | P5 `0x36` across six outputs / an sechs Ausgängen |
| 5 | 201 | HLT, ACC `A00.182` |
