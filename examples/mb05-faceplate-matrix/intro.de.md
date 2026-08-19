# Das Matrix-Faceplate

Keine Pins, kein Steckbrett — das **Controller-Panel ist die Hardware**.
Lade dieses Beispiel und öffne die Controller-Ansicht: eine
5×5-Punktmatrix-Anzeige und zwei Tasten erscheinen, fertig verdrahtet.

- Die Tasten **schreiben** beim Drücken die Programmvariablen
  `btnA` / `btnB`.
- Das Programm antwortet, indem es `screen` schreibt — eine Zahl, eine
  25-Bit-Bitmaske zeilenweise (Bit `Zeile·5+Spalte` = Punkt an).
- Das Matrix-Widget **liest** `screen` live und schaltet die Punkte.

A drücken für ein X, B für einen Balken, nichts für einen einzelnen
Eckpunkt. Das ist das Referenz-*Faceplate-Tripel* — Widgets + Programm +
Bindungen —, aus dem zusammengesetzte Geräte-Faceplates (Taschenrechner,
A2-Tastenfeld + LCD, Retro-Doppelmatrix …) gebaut werden.
