---
level: intermediate
age: 11+
prereqs: [04-thermostat, sense-distance-alarm]
teaches: [sensors, buses, thresholds]
---
## Was du siehst
Ein digitales Thermometer: Jede Sekunde erscheint die Temperatur in ganzen Grad Celsius im seriellen Monitor. Eine blaue LED leuchtet, wenn es kalt ist (unter 18 °C), eine rote, wenn es warm ist (über 28 °C). Verschiebe den Temperaturregler des Sensors und beobachte beide.

## Probier das
1. Stelle den Sensor auf 15 °C, dann 22 °C, dann 31 °C. Welche LEDs leuchten?
2. Stelle ihn auf -10,5 °C. Welche ganze Zahl gibt das Programm aus?
3. Ändere das Programm so, dass im angenehmen Bereich dazwischen eine dritte LED leuchtet.

## Was dahintersteckt
Dieser Sensor misst selbst und schickt das Ergebnis als Zahl. Er braucht nur eine Datenleitung — deshalb heißt der Bus „1-Wire“. Beide Seiten ziehen die Leitung abwechselnd für ein paar Mikrosekunden auf LOW; ein kurzer Impuls bedeutet 1, ein langer 0. Ein Widerstand hält die Leitung auf HIGH, solange niemand zieht.

Die Temperatur zu lesen ist ein Gespräch: Der Chip setzt den Bus zurück, und der Sensor antwortet mit einem eigenen Impuls „ich bin da“; der Chip bittet um eine Messung; dann fragt er nach dem Ergebnis, neun Bytes, deren letztes eine Prüfsumme ist. Stimmt die Prüfsumme nicht, wird der Wert verworfen und neu gemessen. Eine Messung dauert bis zu 0,75 Sekunden, deshalb bekommt das Programm immer die letzte fertige, während die nächste schon läuft.

## Warum das wichtig ist
Heizungen, Kühlschränke und Wetterstationen verwenden genau solche Sensoren. Viele davon können sich eine Leitung teilen, jeder mit seiner eigenen Seriennummer — ein ganzes Haus voller Thermometer an einem einzigen Kabel.

## Weiter geht's
- [04-thermostat](../04-thermostat) — dieselbe Idee mit einem analogen Sensor und einer Heizung.
- [sense-distance-alarm](../sense-distance-alarm) — ein Sensor, der mit der Länge eines Impulses antwortet.
- Experiment: Merke dir die niedrigste und die höchste Temperatur seit dem Start und gib sie ebenfalls aus.
