---
level: beginner
age: 9+
prereqs: [01-blink]
teaches: [logical-output, pin-level, active-low, active-high, retargeting]
---
## Was du siehst
Eine einzelne LED blinkt mit demselben logischen Programm auf jedem unterstützten Mikrocontroller. Bei einem STC12-Ziel nutzt die erzeugte Schaltung Active-Low. Bei einem Push-Pull-Ziel wie Arduino, Pico oder STM32 nutzt sie Active-High.

## Probier das
1. Starte die STC12-Version und beachte: `turn on led` bedeutet dort einen LOW-Pegel.
2. Wähle Arduino Uno und starte dasselbe Programm. Die LED geht weiterhin an, aber der erzeugte Aufbau nutzt einen HIGH-Pegel.
3. Wechsle zwischen weiteren Geräten. Prüfe die `PIN`-Deklaration und verfolge den LED-Pfad zu VCC oder GND.

## Was passiert hier
`turn on` beschreibt den gewünschten logischen Zustand, nicht eine allgemeingültige Spannung. Ein `ACTIVE LOW`-Ausgang ist bei LOW eingeschaltet und nutzt normalerweise den Pfad VCC → Widerstand → LED → Pin. Ein Active-High-Ausgang ist bei HIGH eingeschaltet und nutzt normalerweise Pin → Widerstand → LED → GND. Der Retargeter ändert Pinname, Polaritätsdeklaration und erzeugte Verdrahtung gemeinsam; der Programmkörper bleibt gleich.

Die elektrische Wahl hängt von der Ausgangsstufe des Zielgeräts ab. Die STC12-Lektionen nutzen sein asymmetrisches quasi-bidirektionales Modell; Push-Pull-Ziele können die erzeugte LED-Last direkt speisen. Diese Lektion behauptet nicht, dass verschiedene Chips gleichen Strom oder gleiche Helligkeit erzeugen.

## Warum das wichtig ist
Die Trennung von Absicht und Spannung verhindert einen häufigen Portabilitätsfehler. Der Code kann einheitlich „LED an“ sagen, während die Geräteunterstützung entscheidet, ob das null Volt oder Versorgungsspannung bedeutet.

## Weiter geht's
- [06-active-low-high](../06-active-low-high) — beide Pfade im STC12-Modell vergleichen.
- [32-source-vs-sink](../32-source-vs-sink) — sehen, warum der STC12 die Senkrichtung bevorzugt.
- Experiment: Übertrage das Programm auf ein anderes Ziel und sage die `PIN`-Polarität voraus, bevor du die erzeugte Schaltung öffnest.
