---
level: beginner
age: 10+
prereqs: [avr01-blink]
teaches: [serial-output, adc, potentiometer, debugging]
---
## Was du siehst
Ein Potentiometer am Analogeingang des Arduino. Das Programm liest den ADC-Wert und gibt ihn über die serielle Schnittstelle aus — du siehst die Zahl sich ändern, wenn du am Knopf drehst.

## Probier das
1. Klick auf **Sim** und öffne den seriellen Monitor, um die ADC-Werte zu sehen.
2. Drehe am Poti und beobachte, wie sich die Zahl von 0 bis 1023 ändert.
3. Beachte, dass die Werte alle 0,5 Sekunden aktualisiert werden — das ist die Abtastrate.

## Was passiert hier
Der ADC des Arduino wandelt die Schleiferspannung des Potis (0–5 V) in eine 10-Bit-Zahl (0–1023) um. Das Programm liest diese Zahl und sendet sie als Text über die serielle UART-Schnittstelle. Serielle Ausgabe ist der einfachste Weg, Daten aus einem Mikrocontroller für Debugging oder Protokollierung herauszubekommen — kein Display nötig, nur ein Terminal.

## Warum das wichtig ist
Serielles Drucken ist das `console.log` des Embedded-Entwicklers. Wenn etwas nicht funktioniert, ist das Erste, was man tut, eine Variable auszugeben, um zu sehen, was der Chip tatsächlich sieht. Dieses Muster — Sensor lesen, Wert ausgeben, wiederholen — ist die Methode, jeden Sensor in einem Projekt zu validieren.

## Weiter geht's
- [avr02-dimmer](../avr02-dimmer) — nutze das Poti, um eine LED zu steuern statt zu drucken.
- [avr06-blink-and-print](../avr06-blink-and-print) — serielle Ausgabe, während eine andere Aufgabe läuft.
- Experiment: Gib die Spannung statt des rohen ADC-Werts aus (multipliziere mit 5,0/1023).
