---
level: beginner
age: 10+
prereqs: [01-blink]
teaches: [temperature, on-chip-sensor, serial-output]
---
## Was du siehst
Jeder Messwert geht an den seriellen Monitor, zum Beispiel `Chip: 25 C`, und die LED an D13 blinkt mit: kurz, solange der Chip kühl ist, lang, wenn er wärmer als 30 Grad ist.

## Probier das
1. Starte das Programm und öffne den seriellen Monitor: mit jedem kurzen Blinken eine neue Zeile.
2. Im Simulator steht der Chip auf einem Tisch mit 25 Grad, also bleibt das Blinken kurz. Wenn du die Temperatur des Tischs einstellen kannst, stell sie über 30 und schau, wie es lang wird.
3. An einer echten Platine: Leg eine Weile einen warmen Finger auf den Chip — der Wert steigt langsam.

## Was dahintersteckt
Die Spannung an einem Silizium-Übergang ändert sich um etwa ein Millivolt pro Grad. Der Chip misst einen seiner eigenen Übergänge mit seinem Analog-Digital-Wandler gegen eine feste interne Referenz, und `chip temperature` rechnet den Messwert mit der Kurve aus dem Datenblatt des Chips in Grad um.

Der Wert ist nicht kalibriert: Ein echter Chip kann ein paar Grad danebenliegen, und er misst das Silizium, das etwas wärmer ist als der Raum, wenn der Chip viel zu tun hat. Genau genug, um „zu heiß“ zu bemerken, aber kein Ersatz für ein Thermometer.

## Warum das wichtig ist
Handys, Laptops und Autos überwachen ihre eigenen Chips genau so und werden langsamer, bevor etwas überhitzt. Ein Sensor, den man ohnehin hat, kostet nichts.

## Weiter geht's
- [sense-thermometer-1wire](../sense-thermometer-1wire) — ein eigener DS18B20-Sensor misst den Raum, nicht den Chip.
- Nicht jeder Chip hat einen Sensor: Auf den 8051-Platinen und dem Arduino Mega wird das Programm mit genau diesem Grund abgelehnt.
- Experiment: Gib die höchste bisher gemessene Temperatur aus.
