---
level: beginner
age: 8+
prereqs: [06-active-low-high]
teaches: [source-current, sink-current, wiring-conventions]
---

## Was du siehst

Zwei LEDs verwenden zwei benachbarte MCU-Pins und denselben Widerstandswert.
Eine LED ist vom Pin nach Masse verdrahtet (Source-Beschaltung), die andere von
VCC zum Pin (Sink-Beschaltung). Das Programm schaltet beide dauerhaft ein:
P1.0 bleibt zum Senken auf LOW, P1.1 zum Liefern auf HIGH.

## Probier das aus

1. Klick auf **Sim**. Die Sink-LED ist hell, die Source-LED ist schwach.
2. Pruefe beide Pinpegel: P1.0 ist LOW und P1.1 HIGH; keiner schaltet um.
3. Vergleiche die Helligkeit. Der grosse Unterschied gehoert zum
   quasi-bidirektionalen STC12-Ausgang und gilt nicht allgemein fuer GPIOs.

## Was passiert hier

Ein Mikrocontroller-Pin kann Strom nach aussen treiben (Source) oder nach innen
ziehen (Sink). Im Source-Modus ist der Pin High und der Strom fliesst durch die
LED nach Masse. Im Sink-Modus ist der Pin Low und der Strom fliesst von VCC
durch die LED in den Pin. Beides funktioniert, aber die LED leuchtet bei
entgegengesetzten Logikpegeln. Die aktiv-niedrige Konvention (LED an bei Low)
nutzt den Sink-Modus. Beim STC12 ist das besonders wichtig: Das
quasi-bidirektionale HIGH ist ein schwacher Pull-up, LOW dagegen eine starke
Senke. Push-Pull-GPIOs koennen nahezu symmetrisch sein und gehoeren in die
separate portable Polaritaetslektion.

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
- **Zum Ausprobieren:** Vergleiche beide LED-Helligkeiten, ohne das Programm zu
  aendern. Beim STC12 ist der Unterschied gross und sichtbar.
