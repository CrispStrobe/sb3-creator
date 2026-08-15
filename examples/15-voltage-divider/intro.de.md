---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [voltage-divider, adc-reading]
---
## Was du siehst
Zwei Widerstände bilden einen Spannungsteiler zwischen VCC und Masse. Der MCU liest die Spannung am Verbindungspunkt mit seinem ADC und gibt den Wert aus. Ändert man einen der Widerstände, ändert sich der Messwert.

## Probier das
1. Starte das Programm und notiere den ADC-Wert — er sollte ungefähr der halben Versorgungsspannung entsprechen, wenn beide Widerstände gleich sind.
2. Ändere einen Widerstand auf einen anderen Wert und beobachte, wie sich der Messwert nach oben oder unten verschiebt.
3. Ersetze einen Widerstand durch ein Potentiometer und sieh zu, wie sich der Wert beim Drehen ändert.

## Was passiert hier
Ein Spannungsteiler teilt eine Spannung proportional auf zwei Widerstände auf. Die Spannung am Verbindungspunkt beträgt VCC mal R2 geteilt durch (R1 + R2). Der Analog-Digital-Wandler (ADC) des MCU misst diese Spannung und wandelt sie in eine Zahl um. Bei gleichen Widerständen liegt der Verbindungspunkt auf der halben Versorgungsspannung. Das ist der grundlegende Baustein zum Auslesen jedes resistiven Sensors — Thermistoren, LDRs und Biegesensoren funktionieren alle nach diesem Prinzip.

## Warum das wichtig ist
Die meisten analogen Sensoren sind einfach Widerstände, die sich mit einer physikalischen Größe ändern. Wenn du den Spannungsteiler verstehst, kannst du Temperatur, Licht, Druck und Position messen — alles mit dem gleichen Schaltungsmuster und dem gleichen ADC-Code.

## Weiter geht's
- [01-blink](../01-blink) — das einfachste MCU-Projekt, falls du es noch nicht gemacht hast.
- [03-night-light](../03-night-light) — ein Spannungsteiler in Aktion mit einem lichtabhängigen Widerstand.
- Experiment: Berechne die erwartete Spannung für einen 1k/2k-Teiler, miss dann mit dem ADC und vergleiche.
