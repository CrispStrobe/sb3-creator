# Fernsteuerung mit Licht: ein Dimmer und ein Motorschalter

Eine Fernsteuerung mit Licht: Der Sender lässt eine LED blinken, und wie lange jeder Blitz dauert, bestimmt, wie hell eine LED am anderen Ende leuchtet oder ob ein Motor läuft. Kein Draht verbindet sie.

**Vermittelt:** Pulsweitensteuerung (Tastverhältnis), optische Strecken, Mittelung

## Was zu tun ist

Klick auf **Sim**. Schließ den Sendeschalter. Dreh das Tastverhältnis-Potentiometer und beobachte die ferne grüne LED. Stell dann den Schiebeschalter auf den Motor und schalte den Sender aus und ein.

## Was du sehen solltest

- Die ferne LED wirkt heller oder dunkler, wenn du das Potentiometer drehst.
- In der Motorstellung läuft der Motor, solange der Sender an ist, und läuft aus, wenn er ausgeschaltet wird.

## Warum es funktioniert

Der Multivibrator blinkt etwa 700-mal pro Sekunde. Das Potentiometer ändert, wie die Zeit zwischen „an“ und „aus“ aufgeteilt wird, ohne die Rate stark zu ändern. Am anderen Ende schaltet der LM386 die Last bei jedem Blitz ganz ein und dazwischen aus, die Last bekommt also denselben Zeitanteil. Dein Auge und die Trägheit des Motors mitteln die Pulse, und der Anteil erscheint als Helligkeit oder Drehzahl. Das ist Pulsweitensteuerung, so arbeiten Dimmer und Drehzahlsteller.
