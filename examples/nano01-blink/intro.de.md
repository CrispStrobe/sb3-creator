---
level: beginner
age: 8+
prereqs: []
teaches: [arduino-nano, gpio, blink]
---
## Was du siehst
Eine LED an Pin D13 eines Arduino Nano blinkt einmal pro Sekunde an und aus. Der Nano fuehrt eine Endlosschleife aus, die den Pin umschaltet, mit 500 ms Wartezeit zwischen jeder Aenderung.

## Probier das
1. Starte das Programm und beobachte das LED-Blinken mit 1 Hz.
2. Aendere die Wartezeit von 500 ms auf 200 ms und beobachte das schnellere Blinken.
3. Verschiebe die LED auf einen anderen Pin (z.B. D12) und passe die Pin-Deklaration entsprechend an.

## Was passiert hier
Der Arduino Nano ist ein kleines Mikrocontroller-Board basierend auf dem ATmega328P. Pin D13 hat auf den meisten Nano-Boards eine eingebaute LED, was ihn zum einfachsten Pin fuer Tests macht. Das Programm setzt den Pin auf high, um die LED einzuschalten, wartet, setzt ihn auf low zum Ausschalten und wartet wieder. Das wiederholt sich endlos. Anders als beim STC12 koennen die Pins des Nano genug Strom liefern, um eine LED direkt in Active-High-Verdrahtung zu treiben.

## Warum das wichtig ist
Der Nano ist eines der beliebtesten Boards zum Erlernen der Embedded-Programmierung. Wenn du eine LED blinken lassen kannst, hast du bestaetigt, dass das Board funktioniert, die Toolchain korrekt eingerichtet ist und du die Grundstruktur eines Mikrocontroller-Programms verstehst. Alles Komplexere baut darauf auf.

## Weiter geht's
- [nano02-pot-print](../nano02-pot-print) — einen analogen Sensor auslesen und Werte ausgeben.
- [nano03-two-tasks](../nano03-two-tasks) — zwei Dinge gleichzeitig auf dem Nano ausfuehren.
- Experiment: Schliesse eine externe LED mit Vorwiderstand an einen anderen Pin an und lasse die eingebaute und die externe LED abwechselnd blinken.
