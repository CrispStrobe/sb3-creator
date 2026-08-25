# Der A2-Taschenrechner

Ein Kettenrechner im Hardware-Vokabular des Prechin A2: acht
7-Segment-Ziffern (zwei 4er-Röhren — gemeinsamer Segmentbus an P0,
eine Common-Leitung pro Ziffer an P2), das rote 4×4-Tastenfeld an P1
mit der am A2 vermessenen Zeilen-/Spaltenbelegung und die vier
schwarzen Tasten an P3 als Bearbeitungs-/Speichertasten.

- **Rotes Tastenfeld**: Die vermessene Beschriftung lautet `3 7 B F /
  2 6 A E / 1 5 9 D / 0 4 8 C`. Ziffern werden normal eingegeben;
  `A B C D` sind `+ − × ÷`, `E` löscht und `F` ist Gleich.
- **Schwarze Tasten**: K1 löscht alles, K2 ist Rücktaste, K3 addiert
  den angezeigten Wert zum Speicher (M+), K4 ruft den Speicher ab (MR).
  Nach dem Flashen müssen beide P5-UART-Jumper entfernt werden, damit
  P3.1/P3.0 für K1/K2 frei sind.

Der `SEVENSEG8`-Baustein multiplext die Anzeige per Timer-Interrupt mit
etwa 125 Hz, während der Haupttask Tasten scannt und rechnet. P0 ist der
Segmentbus; P2.2–P2.4 sind die binäre Ziffernadresse des 74HC138.
