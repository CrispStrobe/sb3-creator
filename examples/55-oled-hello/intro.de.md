## OLED-Display

Ein **SSD1306** ist ein 128 x 64 Pixel monochromes OLED, das ueber I2C angesteuert wird.
Zwei Pins tragen den Bus: **SDA** (Daten) und **SCL** (Takt), beide Open-Drain mit 4,7-k-Pull-up-Widerstaenden nach VCC.

Dieses Beispiel loescht den Bildschirm, gibt "HI BRICKWRIGHT" auf Seite 0 aus und zaehlt dann auf Seite 1, jede Sekunde um eins hoch.

### Befehle

| Befehl | Funktion |
|--------|----------|
| `oled clear D` | Gesamtes 128 x 64 Display loeschen |
| `oled print TEXT on D` | Text an der aktuellen Cursorposition ausgeben (5 x 7 Schrift, 21 Zeichen pro Zeile) |
| `oled set cursor ROW COL on D` | Cursor auf Seite ROW (0-7), Zeichenspalte COL (0-20) setzen |
| `oled pixel X Y VALUE on D` | Einzelnen Pixel an (X, Y) setzen — VALUE ist 1 (an) oder 0 (aus) |

### Open-Drain-Lektion

Die Portpins des STC12 sind quasi-bidirektional: Sie koennen 20 mA senken, aber nur ca. 230 uA liefern.
I2C braucht den Bus im Ruhezustand auf HIGH. Ohne die 4,7-k-Widerstaende bleibt der Bus auf LOW und kein Geraet antwortet.
