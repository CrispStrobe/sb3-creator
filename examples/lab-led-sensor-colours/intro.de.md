---
level: intermediate
age: 12+
prereqs: [lab-led-light-sensor, lab-optical-bench]
teaches: [photocurrent, wavelength, led-as-sensor, transimpedance-amplifier]
---
## Was du siehst
Zwei Lampen, eine rote LED und eine Infrarot-LED, leuchten auf zwei Sensoren, die ebenfalls nur LEDs sind: eine rote und eine infrarote. Ein Umschalter legt einen der beiden Sensoren an den Verstärker, und das Messgerät zeigt seinen Fotostrom an, ein Volt pro Mikroampere.

## Probier das
1. Klick auf **Sim**. Nur die rote Lampe ist an, der rote Sensor ist gewählt: Das Messgerät zeigt etwa 0,45 V.
2. Schalte die IR-Lampe dazu. Es ändert sich nichts, denn der rote Sensor sieht kein Infrarot.
3. Schalte auf den IR-Sensor um. Er zeigt viel mehr, schon bei der roten Lampe allein etwa 2,5 V.
4. Probier jetzt die IR-Lampe allein mit beiden Sensoren. Der IR-Sensor sieht sie, der rote zeigt nichts.

## Was passiert hier
Eine LED macht aus Strom Licht einer bestimmten Farbe, und es geht auch umgekehrt: Fällt Licht auf sie, werden Elektronen frei und es fließt ein winziger Strom. Das schaffen aber nur Lichtteilchen, die mindestens so viel Energie tragen wie das eigene Licht der LED. Blaues Licht hat mehr Energie als rotes, rotes mehr als infrarotes. Deshalb sieht eine Infrarot-LED als Sensor rotes und infrarotes Licht, eine rote LED dagegen ist für Infrarot blind. Der Operationsverstärker hält den Sensor auf null Volt und schickt den Fotostrom durch einen 1-MΩ-Widerstand zurück; so wird aus jedem Mikroampere ein Volt.

## Weiter geht's
- [lab-led-light-sensor](../lab-led-light-sensor) — ein LED-Sensor als Dämmerungsschalter.
- [lab-ir-light-meter](../lab-ir-light-meter) — ein Lichtmesser mit IR-LED und Nullpunkteinstellung.
