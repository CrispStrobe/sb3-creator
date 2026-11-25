# Expansion step / Erweiterung im Einzelschritt

**EN.** Install CP3 and drive P3 to `0xB6` (high on terminals 2, 3, 5, 6 and 8, low on the others). Load upper RAM and enter `196 PC`. Press **STEP** five times, checking the table after each press. The program occupies 196–200 and 212 in expansion RAM. Each step executes one instruction with no programmed delay.

**DE.** CP3 anschließen und an P3 `0xB6` anlegen (High an den Anschlüssen 2, 3, 5, 6 und 8, Low an den übrigen). Programm in den oberen Speicherbereich laden und `196 PC` eingeben. Fünfmal **STEP** drücken und jeweils die Tabelle prüfen. Belegt sind die Zellen 196–200 und 212 im Erweiterungsspeicher. Jeder Schritt führt einen Befehl ohne programmierte Wartezeit aus.

| STEP | PC | Expected result / Erwartetes Ergebnis |
| --- | --- | --- |
| 1 | 197 | ACC `A00.182` |
| 2 | 198 | Cell / Zelle 212 `00.182` |
| 3 | 199 | P4 `0xB6` |
| 4 | 200 | P5 `0x36` across six outputs / an sechs Ausgängen |
| 5 | 201 | HLT, ACC `A00.182` |
