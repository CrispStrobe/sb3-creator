---
level: beginner
age: 12+
prereqs: [nano01-blink]
teaches: [adc, serial-output, potentiometer]
---
## Was du siehst
Ein Potentiometer an einem Analogeingang des Arduino Nano. Das Programm liest die Potentiometer-Position und gibt den Wert auf dem seriellen Monitor aus, mit fortlaufender Aktualisierung beim Drehen.

## Probier das
1. Starte das Programm, oeffne den seriellen Monitor und drehe am Potentiometer — beobachte, wie die Zahlen von 0 bis 1023 wechseln.
2. Drehe das Poti in die Mittelstellung und pruefe, dass der Wert nahe 512 liegt.
3. Aendere das Druckintervall und beobachte schnellere oder langsamere Aktualisierungen.

## Was passiert hier
Das Potentiometer ist ein variabler Widerstand, der je nach Stellung eine Spannung zwischen 0 V und 5 V ausgibt. Der ADC (Analog-Digital-Wandler) des Nano tastet diese Spannung ab und wandelt sie in eine Zahl von 0 (0 V) bis 1023 (5 V) mit 10-Bit-Aufloesung um. Das Programm liest diesen Wert in einer Schleife und sendet ihn als Text ueber die serielle Verbindung, die du in einem Terminal anzeigen kannst. Das ist der einfachste Weg, analoge Sensordaten aus einem Mikrocontroller zu holen.

## Warum das wichtig ist
Analoge Werte lesen und anzeigen ist die Grundlage der Datenerfassung. Temperatursensoren, Lichtsensoren, Drucksensoren und Joysticks erzeugen alle analoge Spannungen. Sobald du sie lesen und anzeigen kannst, kannst du Entscheidungen basierend auf Sensoreingaben treffen.

## Weiter geht's
- [nano01-blink](../nano01-blink) — die Grundlagen der Codeausfuehrung auf dem Nano.
- [nano03-two-tasks](../nano03-two-tasks) — einen Sensor lesen, waehrend man etwas anderes tut.
- Experiment: Ersetze das Potentiometer durch einen LDR-Spannungsteiler und beobachte, wie sich die Werte mit dem Umgebungslicht aendern.
