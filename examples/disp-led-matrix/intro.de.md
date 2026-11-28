---
level: beginner
age: 10+
teaches: [led-matrix, max7219, spi, pixel]
---
## Was du siehst
Eine 8×8-LED-Matrix (MAX7219) mit einem wandernden Leuchtbalken.

## Probier das
1. Starte das Programm — ein vertikaler Balken wandert über die Matrix.
2. Ändere den Musterwert 255, um andere LEDs in der Spalte einzuschalten.

## Was passiert hier
Das Programm sendet über DIN, CLK und CS je eine Adresse und ein
Musterbyte an den MAX7219. Der Chip übernimmt das Multiplexing.
