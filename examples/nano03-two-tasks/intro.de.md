---
level: beginner
age: 12+
prereqs: [nano01-blink]
teaches: [multitasking, concurrent-scripts, timing]
---
## Was du siehst
Zwei Skripte laufen gleichzeitig auf dem Arduino Nano: eines blinkt eine LED in einem Takt, waehrend das andere eine zweite LED in einem anderen Takt blinkt. Beide laufen unabhaengig, ohne sich gegenseitig zu stoeren.

## Probier das
1. Starte das Programm und beobachte zwei LEDs, die gleichzeitig mit verschiedenen Geschwindigkeiten blinken.
2. Aendere das Timing einer LED, ohne die andere zu beeinflussen — pruefe, dass sie unabhaengig bleiben.
3. Fuege ein drittes Skript mit einer dritten LED und einem dritten Timing hinzu, um drei gleichzeitige Blinker zu sehen.

## Was passiert hier
Der kooperative Scheduler teilt die Zeit zwischen den beiden Skripten auf. Jedes Skript laeuft, bis es auf ein Wait trifft, und gibt dann an das andere ab. Da jedes Skript sein eigenes Timing unabhaengig verfolgt, blinken die zwei LEDs mit verschiedenen Raten ohne explizite Koordination. So behandelt Scratch mehrere Sprites — jeder hat sein eigenes Skript, das gleichzeitig laeuft — und dasselbe Modell funktioniert auf einem Mikrocontroller.

## Warum das wichtig ist
Echte eingebettete Systeme muessen fast immer mehrere Dinge gleichzeitig tun: eine Status-LED blinken, einen Sensor lesen, einen Taster pruefen. Kooperatives Multitasking erlaubt es, jede Aufgabe als einfaches, lesbares Skript zu schreiben, statt alles in eine komplexe Schleife zu verweben. Das ist das Muster, das von zwei LEDs bis zu vollstaendigen Embedded-Anwendungen skaliert.

## Weiter geht's
- [nano01-blink](../nano01-blink) — Einzelaufgaben-Blink zum Vergleich.
- [pico03-two-tasks](../pico03-two-tasks) — dasselbe Konzept auf einem anderen Mikrocontroller.
- Experiment: Lass eine Aufgabe sehr schnell blinken (50 ms) und die andere sehr langsam (2000 ms) und pruefe, dass sie nicht driften — der Scheduler haelt sie genau.
