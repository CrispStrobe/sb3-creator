---
level: beginner
age: 12+
prereqs: [mega01-blink]
teaches: [multi-channel-adc, serial-output, analog-scanning]
---
## Was du siehst
Der Arduino Mega liest alle 16 Analogeingangs-Kanaele nacheinander und gibt jeden Wert auf dem seriellen Monitor aus. Du siehst eine Tabelle mit Messwerten, die sich fortlaufend aktualisiert, eine Zeile pro Durchlauf.

## Probier das
1. Starte das Programm und oeffne den seriellen Monitor, um alle 16 Kanaele zu sehen.
2. Schliesse ein Potentiometer an einen Kanal an und beobachte, wie sich dessen Wert aendert, waehrend die anderen stabil bleiben.
3. Beruehre einen unbeschalteten Analogpin mit dem Finger und beobachte die springenden Floating-Werte — das zeigt, warum unbenutzte Eingaenge auf Masse gelegt werden sollten.

## Was passiert hier
Der ATmega2560 des Mega hat einen 10-Bit-ADC mit einem 16-Kanal-Multiplexer. Das Programm waehlt jeden Kanal nacheinander, liest die Spannung (0-1023) und gibt sie aus. Ein ADC erledigt die ganze Arbeit — er schaltet nur um, welchen Eingang er betrachtet. Jede Wandlung dauert Mikrosekunden, sodass das Scannen aller 16 Kanaele schnell genug ist, um gleichzeitig zu erscheinen. Das ist dasselbe Prinzip, das in Datenloggern und Multi-Sensor-Systemen verwendet wird.

## Warum das wichtig ist
Viele Projekte brauchen mehr als einen analogen Sensor: Temperatur und Feuchtigkeit, mehrere Lichtsensoren fuer Richtungserkennung, mehrere Potentiometer fuer ein Mischpult. Die 16 Kanaele des Mega bewaltigen das ohne externe Multiplexer und machen ihn zum bevorzugten Board fuer sensorlastige Projekte.

## Weiter geht's
- [mega01-blink](../mega01-blink) — mit den Grundlagen auf dem Mega starten.
- [nano02-pot-print](../nano02-pot-print) — Einkanal-ADC auf dem Nano zum Vergleich.
- Experiment: Schliesse einen Thermistor an einen Kanal und einen LDR an einen anderen an und gib beide Werte in einer Zeile aus — du hast jetzt einen Zwei-Sensor-Datenlogger.
