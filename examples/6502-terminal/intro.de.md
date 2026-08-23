# 6502 Serielles Terminal

Ein serielles Terminal-Faceplate — tippe auf dem Tastatur-Widget,
sieh die Ausgabe auf dem scrollenden Terminal-Display. Inspiriert von
der 6502 + ACIA 6551 Schnittstelle: die klassische "Zeichen tippen,
Echo sehen"-Schleife, mit der jedes 6502-System beginnt.

## Probiere das
1. Klicke **Im Simulator ausfuehren** — das Terminal zeigt "6502 Terminal Ready".
2. Tippe Zeichen in die Tastatureingabe — sie erscheinen im Terminal.
3. Tippe `hello` und druecke Enter — das Terminal antwortet "Hello, world!".
4. Tippe `help` fuer eine Befehlsliste.
5. Tippe `clear` zum Bildschirm loeschen.

## Was passiert hier
Das **Tastatur**-Widget ist eine EINGABE: jedes getippte Zeichen
schreibt in die Scratch-Variable `serial_in`. Das Programm liest
`serial_in`, gibt es nach `serial_out` aus und sammelt einen
Zeilenpuffer. Bei Enter wird die Zeile als Befehl verarbeitet. Das
**Terminal**-Widget ist eine ANZEIGE: es liest `serial_out` und zeigt
die letzten 8 Zeilen als gruene Monospace-Schrift auf schwarzem
Hintergrund — eine scrollende serielle Konsole.
