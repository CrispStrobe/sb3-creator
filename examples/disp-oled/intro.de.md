---
level: beginner
age: 10+
teaches: [oled, i2c, display, ssd1306]
---
## Was du siehst
Ein 128×64-OLED-Display (SSD1306) über I²C. Der Bildschirm zeigt einen
Titel und zählt dann aufwärts.

## Probier das
1. Starte das Programm — "OLED DEMO" erscheint oben.
2. Ändere den Text in `oled print`, um deinen Namen anzuzeigen.
3. Nutze `oled cursor 5 3 on 1` um an Spalte 5, Zeile 3 zu schreiben.

## Was passiert hier
Der SSD1306 wird über I²C angesteuert. `oled clear` löscht den Bildschirm,
`oled cursor` positioniert den Cursor, `oled print` schreibt Text.

## Warum das wichtig ist
OLEDs sind die häufigsten kleinen Displays für Embedded-Projekte.
