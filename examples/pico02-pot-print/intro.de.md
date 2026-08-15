---
level: beginner
age: 12+
prereqs: [pico01-blink]
teaches: [adc, serial-output, potentiometer]
---
## Was du siehst
Ein Potentiometer an einem Analogeingang des Raspberry Pi Pico. Das Programm liest die Potentiometer-Position und gibt den Wert ueber die serielle Schnittstelle aus, mit Aktualisierung beim Drehen.

## Probier das
1. Starte das Programm und oeffne den seriellen Monitor — drehe am Potentiometer und beobachte die Wertaenderungen.
2. Beachte den Bereich: der ADC des Pico hat 12 Bit, also gehen die Werte von 0 bis 4095 statt 0-1023 beim Arduino.
3. Halte das Poti ruhig und beobachte, ob die Messwerte stabil sind oder leicht schwanken — ADC-Rauschen ist normal.

## Was passiert hier
Der RP2040 hat einen 12-Bit-ADC mit vier Kanaelen (GPIO 26-29). Das Potentiometer gibt eine Spannung zwischen 0 und 3,3 V aus, die der ADC in eine Zahl von 0 bis 4095 umwandelt. Hoehere Aufloesung (12 Bit statt 10 Bit) bedeutet feinere Messstufen — jeder Schritt entspricht etwa 0,8 mV statt 4,9 mV. Das Programm liest diesen Wert in einer Schleife und sendet ihn als Text ueber USB-Serial. Der ADC des Pico ist bekannt dafuer, etwas verrauscht zu sein, daher koennen Messwerte um einige Schritte schwanken, selbst bei stabilem Eingang.

## Warum das wichtig ist
Der 12-Bit-ADC des Pico bietet mehr Praezision als der 10-Bit-ADC des Arduino, was bei Sensoren mit kleinen Spannungsaenderungen wichtig ist. ADC-Aufloesung und Rauschen zu verstehen hilft, das richtige Board fuer die Messanforderungen zu waehlen und zu wissen, wann sich externe ADCs lohnen.

## Weiter geht's
- [pico01-blink](../pico01-blink) — die Grundlagen der Pico-Programmierung.
- [nano02-pot-print](../nano02-pot-print) — Vergleich mit dem 10-Bit-ADC des Nano.
- Experiment: Mittele 16 Messwerte vor dem Drucken und beobachte, wie das Rauschen abnimmt — das ist ein einfacher digitaler Filter.
