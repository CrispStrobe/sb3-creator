---
level: beginner
age: 8+
teaches: [neopixel, rgb, color-mixing, ws2812]
---
## Was du siehst
Drei NeoPixel-RGB-LEDs wechseln die Farben in einem Regenbogenmuster.

## Probier das
1. Starte das Programm — drei LEDs wechseln die Farben.
2. Nutze feste Werte wie `set neopixel 0 255 0 0` für reines Rot.
3. Füge mehr Pixel hinzu: `set neopixel 3 ...`

## Was passiert hier
NeoPixel sind adressierbare RGB-LEDs auf einer Datenleitung. Jeder Pixel
hat 8-Bit Rot-, Grün- und Blaukanäle (0–255). Das Programm verschiebt
die Farbwerte pro Takt für einen fließenden Farbwechsel.
