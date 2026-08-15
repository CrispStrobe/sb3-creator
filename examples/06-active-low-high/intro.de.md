---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [active-low, active-high, port-mode]
---
## Was du siehst
Zwei LEDs auf derselben Platine, unterschiedlich verdrahtet. Eine ist active-low (leuchtet, wenn der Pin LOW ist), die andere active-high (leuchtet, wenn der Pin HIGH ist). Das Programm schaltet beide „ein", aber der Befehl bedeutet elektrisch für jede LED etwas anderes.

## Probier das
1. Starte das Programm und beobachte, wie beide LEDs gleichzeitig aufleuchten.
2. Schau dir die Pinwerte im Simulator an — ein Pin ist 0 (low), der andere 1 (high), trotzdem leuchten beide LEDs.
3. Tausche die Beschaltungsart einer LED in der Schaltung und beachte, dass sie sich jetzt umgekehrt verhält.

## Was passiert hier
Die Active-Low-LED ist zwischen VCC und Pin über einen Widerstand angeschlossen. Geht der Pin auf LOW, fließt Strom von VCC durch die LED zum Pin, und sie leuchtet. Die Active-High-LED ist zwischen Pin und Masse über einen Widerstand angeschlossen. Geht der Pin auf HIGH, fließt Strom vom Pin durch die LED nach Masse. Beim 8051 ist Active-Low bevorzugt, weil der Port etwa 20 mA aufnehmen, aber nur ca. 230 µA abgeben kann — zu wenig, um die meisten LEDs hell leuchten zu lassen.

## Warum das wichtig ist
Das Verwechseln von Active-Low und Active-High ist der häufigste Verdrahtungsfehler mit 8051-Chips. Zu wissen, warum „ein" auch „Pin low" bedeuten kann, spart Stunden der Fehlersuche und schützt LEDs davor, mit zu wenig Strom angeschlossen zu werden.

## Weiter geht's
- [01-blink](../01-blink) — das einfachste Active-Low-Beispiel.
- [12-dual-blink](../12-dual-blink) — zwei Active-Low-LEDs im Wechsel.
- Experiment: Miss den Strom durch jede LED im Simulator und bestätige, dass die Active-Low-LED deutlich heller ist.
