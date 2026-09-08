---
level: advanced
age: 16+
prereqs: [01-blink]
teaches: [port-current-limit, aggregate-current, chip-protection]
---
## Was du siehst
Acht LEDs an Port 1 eines STC12C5A60S2, alle gleichzeitig eingeschaltet. Mit 140-Ohm-Widerstaenden zieht im festgelegten Schaltungsmodell jeder Zweig etwa 17,14 mA. Das liegt unter dem 20-mA-Maximum pro Pin, ergibt zusammen aber etwa 137,14 mA und ueberschreitet damit das 120-mA-Gesamtbudget des Chips.

## Probier das
1. Starte die Simulation mit allen acht LEDs an und addiere die acht Zweigstroeme.
2. Schalte die Haelfte der LEDs aus und bestaetige, dass der Gesamtstrom unter 120 mA sinkt.
3. Fuege einen Transistortreiber fuer eine LED hinzu und beobachte, dass deren Laststrom nicht mehr durch den MCU-Pin fliesst.

## Was passiert hier
Dieses Beispiel ist bewusst STC12-spezifisch. Sein Datenmodell verwendet 20 mA als Maximum pro Pin und 120 mA als Gesamtbudget. Acht Zweige koennen also einzeln unter 20 mA bleiben und zusammen trotzdem das Gesamtbudget ueberschreiten. Die Deklarationswarnung rechnet konservativ mit achtmal 20 mA; die Schaltungsmessung prueft zusaetzlich die tatsaechlichen Modellstroeme. Andere Controller haben andere Grenzwerte und Ausgangsstufen — lies immer ihr Datenblatt. Fuer groessere Lasten nutzt man Transistoren oder Treiber-ICs.

## Warum das wichtig ist
Das ist einer der haeufigsten Anfaengerfehler im Embedded-Design. Ein Projekt funktioniert mit ein oder zwei LEDs, versagt aber raetselhaft beim Hochskalieren. Gesamtstromgrenzen zu verstehen verhindert verbrannte Chips und lehrt, Datenblaetter sorgfaeltig zu lesen.

## Weiter geht's
- [38-npn-switch](../38-npn-switch) — nutze einen Transistor, um eine LED anzutreiben, ohne den MCU-Pin zu belasten.
- [08-led-chaser-595](../08-led-chaser-595) — nutze ein Schieberegister, um viele LEDs mit nur wenigen MCU-Pins anzusteuern.
- Experiment: Schlag im Datenblatt deines MCU die Grenzwerte pro Pin und insgesamt nach und berechne daraus eine sichere Zahl direkt getriebener LEDs.
