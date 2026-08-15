---
level: beginner
age: 12+
prereqs: [mega01-blink]
teaches: [port-current, led-walker, aggregate-current]
---
## Was du siehst
Acht LEDs an einem Port des Arduino Mega, die nacheinander einzeln aufleuchten wie ein Lauflicht. Das Muster wandert von Pin 0 bis Pin 7 und wiederholt sich.

## Probier das
1. Starte das Programm und beobachte, wie eine einzelne LED ueber die Reihe von acht wandert.
2. Aendere den Code, um zwei benachbarte LEDs gleichzeitig zu leuchten, und beobachte das Muster.
3. Versuche, alle acht LEDs gleichzeitig einzuschalten, und pruefe, ob sie dunkler sind — das zeigt die Gesamtstromgrenze des Ports.

## Was passiert hier
Jeder Port des ATmega2560 gruppiert acht Pins, die ueber ein Portregister gleichzeitig geschrieben werden koennen. Das Programm schiebt ein Bit durch die Positionen 0-7 und leuchtet jeweils eine LED. Jeder Pin kann etwa 20 mA liefern, aber der gesamte Port hat eine Gesamtgrenze (etwa 100-200 mA je nach Chip). Eine LED zur Zeit bleibt weit innerhalb der Grenzen. Alle acht gleichzeitig stossen an das Gesamtmaximum, weshalb sie dunkler werden koennen — der Chip schuetzt sich durch Strombegrenzung.

## Warum das wichtig ist
Port-basiertes I/O ist schneller als Pin-fuer-Pin-Schreiben und unverzichtbar fuer Displays, LED-Arrays und parallele Busse. Die Gesamtstromgrenze zu verstehen verhindert eine Ueberlastung des Chips — ein Fehler, der zu dunklen Ausgaengen, instabilem Verhalten oder dauerhaftem Schaden fuehren kann.

## Weiter geht's
- [mega01-blink](../mega01-blink) — Einzelpin-Ausgabe zum Vergleich.
- [mega02-adc-print](../mega02-adc-print) — Eingaenge ueber mehrere Kanaele lesen.
- Experiment: Fuege Vorwiderstaende mit verschiedenen Werten an jede LED an und miss den Gesamtportstrom mit einem Multimeter, um die praktische Gesamtgrenze zu finden.
