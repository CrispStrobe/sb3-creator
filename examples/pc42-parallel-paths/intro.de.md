---
level: beginner
age: 10+
prereqs: [pc04-parallel-leds]
teaches: [parallel-circuits, unequal-branches]
---
## Was du siehst
Zwei LEDs parallel mit unterschiedlichen Vorwiderständen, beide versorgt von 9 V. Sie leuchten unterschiedlich hell, weil jeder Zweig einen anderen Strom führt.

## Probier das
1. Klick auf **Sim** und vergleiche die Helligkeit der beiden LEDs.
2. Prüfe die Spannung über jeder LED — sie unterscheiden sich leicht wegen des Shockley-Diodenmodells (höherer Strom = höhere Flussspannung).
3. Ändere einen Widerstand, um ihn dem anderen anzugleichen. Jetzt leuchten beide LEDs gleich hell.

## Was passiert hier
Jeder parallele Zweig ist unabhängig: Beide sehen die vollen 9 V der Versorgung, aber unterschiedliche Widerstandswerte bedeuten unterschiedliche Ströme. Der Zweig mit dem kleineren Widerstand führt mehr Strom und leuchtet heller. Der Gesamtstrom aus der Versorgung ist die Summe beider Zweige. Einen Zweig zu ändern hat keine Auswirkung auf den anderen.

## Warum das wichtig ist
Reale Parallelschaltungen haben fast nie identische Zweige. Zu verstehen, dass jeder Zweig seinen eigenen Strom unabhängig bestimmt, erlaubt es, verschiedene Verbraucher an derselben Versorgung zu mischen, ohne dass sie sich gegenseitig stören.

## Weiter geht's
- [pc04-parallel-leds](../pc04-parallel-leds) — gleiche Zweige zum Vergleich.
- [pc30-resistor-ladder](../pc30-resistor-ladder) — viele parallele Zweige als Leiter.
- Experiment: Sage den Strom in jedem Zweig mit dem ohmschen Gesetz vorher und überprüfe im Simulator.
