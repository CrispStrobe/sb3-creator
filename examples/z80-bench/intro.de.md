---
level: advanced
age: 16+
prereqs: []
teaches: [z80-cpu, retro-computing, serial-output]
---
## Was du siehst
Ein Z80-Breadboard-Computer mit ROM, RAM und serieller Schnittstelle. Der Z80 fuehrt ein Programm aus dem ROM aus, das Text ueber den seriellen Port sendet — die Ausgabe erscheint in einem Terminal. Das ist ein minimaler funktionierender Computer aus einer Handvoll Chips.

## Probier das
1. Starte die Simulation und beobachte, wie "Hello" im seriellen Terminal erscheint — der Z80 laeuft.
2. Verlangsame den Takt und beobachte die Bus-Aktivitaet des Z80: sich aendernde Adressleitungen, Datenleitungen mit Opcodes und den UART, der Bytes sendet.
3. Aendere die Nachricht im ROM und sieh den neuen Text im Terminal.

## Was passiert hier
Der Z80 holt Befehle aus dem ROM ueber einen 8-Bit-Datenbus, adressiert durch einen 16-Bit-Adressbus. RAM bietet Arbeitsspeicher. Der UART (serielle Schnittstelle) wandelt parallele Daten vom Z80 in einen seriellen Bitstrom mit fester Baudrate um. Um ein Zeichen auszugeben, schreibt das Programm dessen ASCII-Code in das Datenregister des UART. Der Z80 war die CPU hinter dem ZX Spectrum, Amstrad CPC und unzaehligen CP/M-Rechnern. Er aehnelt dem 8080, hat aber einen reicheren Befehlssatz und mehr Register.

## Warum das wichtig ist
Die Z80-Familie wurde hunderte Millionen Mal verkauft und betrieb die erste Generation von Personalcomputern. Einen auf dem Breadboard zu bauen zeigt, dass ein vollstaendiger Computer erstaunlich wenige Teile braucht: eine CPU, etwas Speicher, einen Takt und ein I/O-Geraet. Dieselbe Bus-Architektur — Adressbus, Datenbus, Steuersignale — findet sich in jedem jemals gebauten Computer, nur breiter und schneller.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — eine andere klassische CPU auf dem Breadboard.
- [eater6502-vdp-hello](../eater6502-vdp-hello) — Videoausgabe zu einem Retro-Breadboard-Computer hinzufuegen.
- Experiment: Schreibe ein Programm, das serielle Eingaben zurueck an das Terminal sendet — vom UART lesen und das Empfangene zurueckschreiben macht den Z80 zu einem interaktiven System.
