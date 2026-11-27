---
level: intermediate
age: 12+
prereqs: [arduino-01-digital-read-serial]
teaches: [ultrasonic, distance, pulse-timing]
---
## Was du siehst
Ein Ultraschallsensor misst Entfernung durch Puls-Zeitmessung — nähere Objekte bedeuten kürzere Echozeiten.

## Probier das
1. Starte das Programm und öffne den seriellen Monitor.
2. Vergleiche die Messwerte bei 40 cm und 120 cm.
3. Bei 600 cm überschreitet das Echo das Messfenster. Die Ausgabe ist dann 999.

## Was passiert hier
Der Mikrocontroller legt für 10 µs einen hohen Pegel an TRIG. Der Sensor hält ECHO pro Zentimeter Entfernung etwa 58 µs lang auf einem hohen Pegel. Aus der gemessenen Pulsdauer berechnet das Programm die Entfernung in Zentimetern.

## Weiter geht's
- Experimentiere mit verschiedenen Sensortypen und Anzeigekonfigurationen.
