---
level: beginner
age: 8+
prereqs: [06-active-low-high]
teaches: [source-current, sink-current, wiring-conventions]
---

## Was du siehst

Zwei LEDs sind an denselben MCU-Pin angeschlossen, aber in entgegengesetzter
Richtung. Eine LED ist vom Pin nach Masse verdrahtet (Source-Beschaltung: Strom
fliesst aus dem Pin heraus). Die andere ist von VCC zum Pin verdrahtet
(Sink-Beschaltung: Strom fliesst in den Pin hinein). Wenn der Pin auf High geht,
leuchtet die Source-LED und die Sink-LED erlischt. Wenn der Pin auf Low geht,
ist es umgekehrt.

## Probier das aus

1. Klick auf **Sim**. Eine LED ist an, die andere aus.
2. Warte, bis der Pin umschaltet. Die LEDs tauschen -- die, die an war, geht
   aus, und die, die aus war, geht an.
3. Schau dir die Stromwerte beider LEDs an. Bei den meisten Mikrocontrollern
   ist die Sink-Strombelastbarkeit etwas hoeher als die Source-Belastbarkeit,
   weshalb aktiv-niedrige (Sink-)Beschaltung in der Praxis ueblicher ist.

## Was passiert hier

Ein Mikrocontroller-Pin kann Strom nach aussen treiben (Source) oder nach innen
ziehen (Sink). Im Source-Modus ist der Pin High und der Strom fliesst durch die
LED nach Masse. Im Sink-Modus ist der Pin Low und der Strom fliesst von VCC
durch die LED in den Pin. Beides funktioniert, aber die LED leuchtet bei
entgegengesetzten Logikpegeln. Die aktiv-niedrige Konvention (LED an bei Low)
nutzt den Sink-Modus und ist Standard auf den meisten Entwicklungsboards, weil
der Pin typischerweise mehr Strom senken als sourcen kann.

## Warum das wichtig ist

Das Verstaendnis von Source- und Sink-Beschaltung verhindert den haeufigsten
Anfaengerfehler: eine LED verdrahten und feststellen, dass sie leuchtet, wenn
man erwartet, dass sie aus ist, und umgekehrt. Es ist auch wichtig beim
Anschluss an externe Treiber-ICs, Relais oder Optokoppler, die oft eine
bestimmte Polaritaet erwarten.

## Weiter geht's

- **Die Logik dahinter:** [06-active-low-high](../06-active-low-high) --
  aktiv-niedrige und aktiv-hohe Logik erklaert.
- **Wenn Ueberstrom wichtig wird:**
  [31-no-resistor-led](../31-no-resistor-led) -- Ueberschreitung der
  Strombelastbarkeit des Pins.
- **Zum Ausprobieren:** Miss den genauen Strom im Source- und Sink-Modus mit
  dem gleichen Widerstandswert. Auf einem STC12 ist der Unterschied klein, aber
  messbar -- der Pin-Treiber ist nicht perfekt symmetrisch.
