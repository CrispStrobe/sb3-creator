---
level: beginner
age: 10+
teaches: [led-matrix, max7219, spi, pixel]
---
## Was du siehst
Eine 8×8-LED-Matrix (MAX7219) mit einem wandernden Leuchtbalken.

## Probier das
1. Starte das Programm — ein vertikaler Balken wandert über die Matrix.
2. Ändere die `set pixel`-Zeilen für eigene Muster.

## Was passiert hier
Der MAX7219 steuert die Matrix über SPI. `clear matrix` löscht, `set pixel`
schaltet einzelne LEDs ein. Das Multiplexing übernimmt der Chip.
