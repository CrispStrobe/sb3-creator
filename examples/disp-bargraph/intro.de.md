---
level: beginner
age: 10+
teaches: [bargraph, adc, led, analog-input]
---
## Was du siehst
Ein 8-LED-Balkendiagramm zeigt den Poti-Pegel. Drehe den Poti — der Balken
wächst oder schrumpft.

## Probier das
1. Starte und drehe den Poti — LEDs leuchten von unten nach oben.
2. Ersetze den Poti durch `read light` für einen Lichtmesser.

## Was passiert hier
Der Poti gibt 0–1023 am ADC aus. Division durch 128 ergibt 0–7 Stufen.
Jedes `if level > N` schaltet eine weitere LED ein.
