---
level: beginner
age: 10+
prereqs: [arduino-01-analog-read-serial]
teaches: [analog-input, voltage-conversion, adc, serial-print]
---
## Was du siehst
Ein Potentiometer an Pin A0. Das Programm liest den ADC-Wert, rechnet ihn in Spannung (0–5 V) um und gibt das Ergebnis aus.

## Probier das
1. Starte das Programm und drehe am Potentiometer — die Spannungsanzeige ändert sich.
2. Stelle das Potentiometer auf die Mitte: die Spannung sollte ungefähr 2,5 V anzeigen.
3. Vergleiche mit der Rohwert-Version (AnalogReadSerial) — diese zeigt aussagekräftige Einheiten.

## Was passiert hier
Der ADC wandelt die Spannung an A0 in eine Zahl 0–1023 um. Die Formel `sensorValue * (5.0 / 1023)` rechnet das in Volt zurück: 0 → 0,00 V, 512 → 2,50 V, 1023 → 5,00 V. So funktioniert jede Analogmessung: Rohwert lesen, dann mit Referenzspannung und ADC-Auflösung in echte Einheiten umrechnen.

## Warum das wichtig ist
ADC-Werte in reale Einheiten (Volt, Grad, Gramm) umzurechnen ist die Grundfertigkeit für sensorbasierte Projekte.

## Weiter geht's
- Experiment: mit einem 3,3-V-Board wird die Formel zu `sensorValue * (3.3 / 1023)`.
- [arduino-01-fade](../arduino-01-fade) — ein analogähnliches Signal ausgeben statt eines zu lesen.
