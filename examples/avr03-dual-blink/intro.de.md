---
level: beginner
age: 8+
prereqs: [avr01-blink]
teaches: [multitasking, concurrent-scripts, timing]
---
## Was du siehst
Zwei LEDs blinken mit unterschiedlichen Geschwindigkeiten — eine schnell, eine langsam. Beide laufen gleichzeitig auf einem Arduino, jede von ihrem eigenen Skript gesteuert.

## Probier das
1. Klick auf **Sim** und beobachte beide LEDs. Sie blinken unabhängig voneinander.
2. Ändere das Timing einer LED, ohne die andere zu beeinflussen — das beweist, dass sie gleichzeitig laufen.
3. Setze beide auf dieselbe Rate und beobachte, wie sie sich synchronisieren.

## Was passiert hier
Das Programm hat zwei `WHEN flag clicked`-Skripte, jedes mit seiner eigenen Endlosschleife und eigenem Timing. Der kooperative Scheduler gibt jedem Skript Zeit: Wenn ein Skript wartet, kommt das andere dran. So funktioniert Scratch-artige Nebenläufigkeit — keine echte Parallelausführung, sondern verschachtelte Skripte, die gleichzeitig erscheinen.

## Warum das wichtig ist
Echte eingebettete Systeme müssen fast immer mehrere Dinge gleichzeitig tun — eine Status-LED blinken lassen, während ein Sensor gelesen wird, oder einen Motor antreiben, während ein Taster überwacht wird. Kooperatives Multitasking ist der einfachste Weg, das ohne ein volles Betriebssystem zu erreichen.

## Weiter geht's
- [avr06-blink-and-print](../avr06-blink-and-print) — ein Skript blinkt, das andere druckt Sensordaten.
- [12-dual-blink](../12-dual-blink) — dasselbe Konzept auf einem STC12-Mikrocontroller.
- Experiment: Füge eine dritte LED an D11 mit einem dritten Timing-Wert hinzu.
