---
level: beginner
age: 12+
prereqs: [pico01-blink]
teaches: [multitasking, concurrent-scripts]
---
## Was du siehst
Zwei Skripte laufen gleichzeitig auf dem Raspberry Pi Pico: eines blinkt eine LED in einem Takt, waehrend das andere eine zweite LED in einem anderen Takt blinkt. Beide Skripte laufen unabhaengig auf demselben Kern.

## Probier das
1. Starte das Programm und beobachte zwei LEDs, die mit verschiedenen Geschwindigkeiten blinken.
2. Aendere das Timing eines Skripts und pruefe, dass das andere nicht beeinflusst wird.
3. Fuege eine dritte gleichzeitige Aufgabe hinzu — der Scheduler behandelt sie auf dieselbe Weise.

## Was passiert hier
Der kooperative Scheduler fuehrt beide Skripte auf einem einzelnen Kern aus und wechselt bei jedem Wait-Punkt zwischen ihnen. Jedes Skript verfolgt seine eigene Deadline, sodass die zwei Blinkraten unabhaengig bleiben. Der Pico hat zwei Kerne, aber der Scheduler braucht den zweiten dafuer nicht — kooperatives Multitasking funktioniert durch Zeitteilung innerhalb eines Kerns. Der zweite Kern steht fuer wirklich parallele Arbeit zur Verfuegung, falls spaeter noetig.

## Warum das wichtig ist
Gleichzeitige Aufgaben sind die natuerliche Art, eingebettetes Verhalten auszudruecken: eine Aufgabe liest einen Sensor, eine andere aktualisiert ein Display, eine dritte prueft Benutzereingaben. Der Scheduler des Pico macht das so einfach wie separate Scratch-Skripte zu schreiben. Das Konzept ist identisch zum Multitasking des Nano und zeigt, dass das Programmiermodell hardwareuebergreifend portabel ist.

## Weiter geht's
- [pico01-blink](../pico01-blink) — Einzelaufgaben-Startpunkt.
- [nano03-two-tasks](../nano03-two-tasks) — dasselbe Konzept auf dem Arduino Nano.
- Experiment: Lass eine Aufgabe seriell drucken, waehrend die andere eine LED blinkt, und pruefe, dass beides reibungslos ohne Timing-Stoerungen funktioniert.
