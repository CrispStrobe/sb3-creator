---
level: beginner
age: 8+
prereqs: []
teaches: [mcu-basics, gpio, active-low]
---
## Was du siehst
Eine LED blinkt einmal pro Sekunde. Der Mikrocontroller führt eine Endlosschleife aus, die den Pin umschaltet und jeweils 500 ms zwischen den Zustandsänderungen wartet. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und beobachte, wie die LED mit 1 Hz blinkt.
2. Ändere die Wartezeit von 500 ms auf 100 ms und schau, wie das Blinken schneller wird.
3. Vertausche am Anfang `turn on LED` und `turn off LED` — bei diesem STC12-Aufbau kehrt sich das Muster um, weil seine LED Active-Low verdrahtet ist.

## Was passiert hier
Beim ursprünglichen STC12-Aufbau liegt die LED über einen Widerstand zwischen Versorgung und P1.0. LOW schließt diesen Active-Low-Pfad. Wählst du ein anderes Gerät, kann der Retargeter stattdessen einen Active-High-Pfad vom Pin nach Masse erzeugen; `turn on` und `turn off` behalten in beiden Fällen ihre logische Bedeutung.

## Warum das wichtig ist
Blink ist das „Hello World" der Embedded-Programmierung. Wenn deine LED blinkt, weißt du, dass der Chip läuft, der Takt stimmt und die Pin-Zuordnung funktioniert. Jedes MCU-Projekt beginnt hier.

## Weiter geht's
- [12-dual-blink](../12-dual-blink) — zwei LEDs im Wechsel blinken lassen.
- [06-active-low-high](../06-active-low-high) — beide Beschaltungsarten nebeneinander sehen.
- [56-logical-on-pin-level](../56-logical-on-pin-level) — logischen LED-Zustand und elektrischen Pinpegel auf verschiedenen Chips vergleichen.
- Experiment: Probiere eine 2-Sekunden-Periode (1000 ms an, 1000 ms aus) und überprüfe das Timing mit einer Stoppuhr.
