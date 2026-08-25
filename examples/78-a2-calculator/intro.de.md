# Der A2-Taschenrechner

Ein Kettenrechner im Hardware-Vokabular des Prechin A2: acht
7-Segment-Ziffern (zwei 4er-Röhren — gemeinsamer Segmentbus an P0,
eine Common-Leitung pro Ziffer an P2), das rote 4×4-Tastenfeld an P1
mit der am A2 vermessenen Zeilen-/Spaltenbelegung und die vier
schwarzen Tasten an P3 als Bearbeitungs-/Speichertasten.

- **Rotes Tastenfeld**: `1–9, 0` geben Ziffern ein; `A B C D` sind
  `+ − × ÷`; `#` ist Gleich; `*` löscht die aktuelle Eingabe.
- **Schwarze Tasten**: K1 löscht alles, K2 ist Rücktaste, K3 addiert
  den angezeigten Wert zum Speicher (M+), K4 ruft den Speicher ab (MR).

Zwei kooperative Tasks teilen sich den Chip — einer multiplext die
Anzeige mit etwa 125 Hz aus einem einzigen `shown`-Wert (jede Ziffer
per Division berechnet, mit Ausblendung führender Nullen), der andere
scannt die Tasten und rechnet. Dasselbe Programm kompiliert zu C für
den echten STC89C52RC: Auf dem physischen A2 laufen die Commons durch
den 74HC138 und die Segmente durch den 74HC245, aber die
Port-Bedeutungen (P0 = Segmente, P2 = Auswahl, P1 = Tastenfeld) sind
genau die des Boards.
