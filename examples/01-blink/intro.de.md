---
level: beginner
age: 8+
prereqs: []
teaches: [mcu-basics, gpio, active-low]
---
## Was du siehst
Eine LED an Pin P1.0 blinkt einmal pro Sekunde. Der STC12-Mikrocontroller führt eine Endlosschleife aus, die den Pin umschaltet und jeweils 500 ms zwischen den Zustandsänderungen wartet.

## Probier das
1. Starte das Programm und beobachte, wie die LED mit 1 Hz blinkt.
2. Ändere die Wartezeit von 500 ms auf 100 ms und schau, wie das Blinken schneller wird.
3. Vertausche `turn on LED` und `turn off LED` am Anfang — das Muster kehrt sich um, weil die LED active-low verdrahtet ist.

## Was passiert hier
Die LED ist zwischen Versorgungsspannung und Pin P1.0 über einen Widerstand angeschlossen. Wenn der MCU den Pin auf LOW (0) zieht, fließt Strom durch die LED und sie leuchtet. Bei HIGH (1) liegt an beiden Seiten die gleiche Spannung und es fließt kein Strom. Das nennt man Active-Low-Beschaltung — „einschalten" bedeutet hier, den Pin auf Masse zu ziehen. Die quasi-bidirektionalen Ports des 8051 können viel mehr Strom aufnehmen als abgeben, deshalb ist Active-Low die Standardbeschaltung für LEDs.

## Warum das wichtig ist
Blink ist das „Hello World" der Embedded-Programmierung. Wenn deine LED blinkt, weißt du, dass der Chip läuft, der Takt stimmt und die Pin-Zuordnung funktioniert. Jedes MCU-Projekt beginnt hier.

## Weiter geht's
- [12-dual-blink](../12-dual-blink) — zwei LEDs im Wechsel blinken lassen.
- [06-active-low-high](../06-active-low-high) — beide Beschaltungsarten nebeneinander sehen.
- Experiment: Probiere eine 2-Sekunden-Periode (1000 ms an, 1000 ms aus) und überprüfe das Timing mit einer Stoppuhr.
