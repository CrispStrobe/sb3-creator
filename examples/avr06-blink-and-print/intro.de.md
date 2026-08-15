---
level: beginner
age: 10+
prereqs: [avr01-blink, avr04-serial-pot]
teaches: [multitasking, concurrent-scripts, serial-output]
---
## Was du siehst
Eine LED blinkt, während der serielle Monitor Potentiometer-Werte anzeigt — zwei Aufgaben laufen gleichzeitig auf einem Arduino. Keine Aufgabe blockiert die andere.

## Probier das
1. Klick auf **Sim** und beobachte, wie die LED blinkt, während serielle Ausgaben strömen.
2. Drehe am Poti und sieh, wie sich die gedruckten Werte ändern, ohne die Blinkrate zu beeinflussen.
3. Ändere das Blink-Timing — die serielle Ausgabe läuft in ihrem eigenen Takt weiter.

## Was passiert hier
Zwei `WHEN flag clicked`-Skripte laufen kooperativ. Das erste schaltet die LED alle 0,5 Sekunden um. Das zweite liest den ADC-Wert des Potis und gibt ihn alle 0,5 Sekunden aus. Der Scheduler verschachtelt sie an ihren Wartepunkten, sodass beide gleichzeitig zu laufen scheinen. Das ist dasselbe kooperative Modell wie bei Scratch — jedes Skript gibt bei jedem Warten ab, und der Scheduler wählt das nächste.

## Warum das wichtig ist
Echte Anwendungen kombinieren fast immer E/A mit Anzeige oder Protokollierung. Dieses Beispiel beweist, dass das Muster funktioniert: Sensorablesung und Statusanzeige laufen unabhängig, jede in ihrem eigenen Takt, ohne komplexes Thread-Management.

## Weiter geht's
- [avr03-dual-blink](../avr03-dual-blink) — zwei unabhängige Blink-Aufgaben.
- [nano03-two-tasks](../nano03-two-tasks) — dasselbe Muster auf einem Arduino Nano.
- Experiment: Füge ein drittes Skript hinzu, das einen Taster liest und „pressed" oder „released" ausgibt.
