---
level: intermediate
age: 12+
prereqs: [arduino-01-analog-read-serial]
teaches: [calibration, auto-range, sensor, mapping, moving-average]
---
## Was du siehst
Kalibriert einen Sensor automatisch während der ersten 5 Sekunden, bildet dann seinen Bereich auf LED-Helligkeit ab.

## Probier das
1. Starte das Programm und beobachte das Verhalten.
2. Ändere einen Parameter und schau, wie sich die Ausgabe ändert.

## Was passiert hier
Dieser Sketch demonstriert ein Arduino-Analog-I/O-Muster. Siehe die .bw-Datei für Details.

Jeder Messwert läuft durch einen gleitenden Mittelwert über vier Abtastungen. Das kostet Zeit, und der Preis wird genannt statt versteckt: Die Schleife läuft alle 20 ms, also braucht das Fenster 4 x 20 ms = 80 ms, um einem Sprung vollständig zu folgen, und hinkt einer Rampe um (4 - 1) / 2 x 20 ms = 30 ms hinterher. Bei einem Sprung steigt das Tastverhältnis in vier gleichen Vierteln: 24, 49, 74, 100 Prozent.

## Weiter geht's
- Experimentiere mit verschiedenen Werten und Kombinationen.
