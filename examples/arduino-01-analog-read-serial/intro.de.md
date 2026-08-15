---
level: beginner
age: 10+
prereqs: [arduino-01-blink]
teaches: [analog-input, adc, potentiometer, serial-print]
---
## Was du siehst
Ein Potentiometer an Pin A0. Das Programm liest seine Position und gibt den ADC-Wert (0–1023) auf dem seriellen Terminal aus.

## Probier das
1. Starte das Programm und drehe am Potentiometer — die ausgegebenen Werte ändern sich.
2. Drehe ganz links (0) und ganz rechts (1023), um den Bereich zu sehen.
3. Probiere einen anderen Analogpin (A1–A5).

## Was passiert hier
Der ADC (Analog-Digital-Wandler) des Arduino misst die Spannung an Pin A0 und wandelt sie in eine Zahl zwischen 0 (0 V) und 1023 (5 V) um. Das Potentiometer wirkt als Spannungsteiler: Drehen ändert die Spannung am Schleifer, die A0 liest.

## Warum das wichtig ist
Analogsensoren lesen ist die Art, wie Mikrocontroller die reale Welt messen — Temperatur, Licht, Position, Kraft.

## Weiter geht's
- [arduino-01-read-analog-voltage](../arduino-01-read-analog-voltage) — den ADC-Wert in echte Spannung umrechnen.
- [arduino-01-fade](../arduino-01-fade) — die Potentiometer-Lesung zur LED-Steuerung verwenden.
