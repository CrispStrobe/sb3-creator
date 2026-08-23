---
level: beginner
age: 10+
teaches: [lcd, i2c, display, hd44780]
---
## Was du siehst
Ein 16×2-Zeichen-LCD (HD44780 mit I²C-Backpack). Titel oben, Zähler unten.

## Probier das
1. Starte das Programm — "LCD DEMO" oben, Zähler unten.
2. Nutze `lcd cursor 8 0 on 1` für Position Spalte 8, Zeile 0.
3. Drucke Berechnungen: `lcd print (count * 2) on 1`.

## Was passiert hier
Das HD44780-LCD nutzt einen PCF8574-I²C-Backpack. `lcd clear` löscht,
`lcd cursor` positioniert, `lcd print` schreibt Text oder Zahlen.

## Warum das wichtig ist
Zeichen-LCDs findet man überall — Geräte, Messgeräte, Arduino-Projekte.
