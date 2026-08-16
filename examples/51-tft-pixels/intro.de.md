## TFT-Farbdisplay

Ein **ILI9341** ist ein 240 x 320 Pixel Farb-TFT, das ueber SPI angesteuert wird.
Vier Pins tragen den gesamten Bus: **CS** (Chip Select), **DC** (Daten/Befehl), **SCK** (Takt) und **MOSI** (Daten).

Dieses Beispiel loescht den Bildschirm (schwarz), zeichnet dann drei farbige Rechtecke (rot, gruen, blau) und einen einzelnen weissen Pixel in der Mitte.

### Befehle

| Befehl | Funktion |
|--------|----------|
| `tft clear D` | Gesamten Bildschirm schwarz fuellen |
| `tft fill X Y W H R r G g B b on D` | Rechteck an (X, Y), Groesse W x H, Farbe (r, g, b) fuellen |
| `tft pixel X Y R r G g B b on D` | Einzelnen Pixel an (X, Y) auf Farbe (r, g, b) setzen |

Farben sind 0-255 pro Kanal; der Treiber wandelt in RGB565 um.
