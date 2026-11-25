# Lichtorgel mit Verstärker

Das Signal des Musikspielers ist schwach. Ein Verstärker macht es kräftig genug; dann teilen zwei Filter es auf, und die Bässe lassen eine rote LED leuchten, die Höhen eine blaue.

**Vermittelt:** Audioverstärker, Hochpass und Tiefpass, Transistor als Schalter

## Was zu tun ist

Klick auf **Sim**. Der Funktionsgenerator (function_gen_3) steht für die Musik, mit 80 Hz: schau auf die beiden LEDs. Erhöhe seine Frequenz schrittweise auf 300 Hz und dann 1500 Hz.

## Was du sehen solltest

- 80 Hz: Rot leuchtet, Blau bleibt dunkel.
- Um 300 Hz: beide leuchten ein wenig.
- 1500 Hz: Blau leuchtet, Rot bleibt dunkel.

## Warum es funktioniert

Der Verstärker macht aus 0,15 V etwa 3 V. Ein kleiner Kondensator im Höhenzweig lässt nur schnelle Schwingungen zum Transistor der blauen LED durch; im Basszweig schluckt ein großer Kondensator nach Masse die schnellen Schwingungen, sodass nur langsame den Transistor der roten LED erreichen. Ein Transistor braucht etwa 0,7 V an der Basis, bevor er leitet — darum ist der Verstärker nötig.
