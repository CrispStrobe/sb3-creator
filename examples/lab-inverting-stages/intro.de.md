---
level: intermediate
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [common-emitter, inversion, cascade, analog-dimmer]
---
## Was du siehst
Ein Drehknopf und zwei Transistorstufen hintereinander. An jedem Kollektor hängt eine LED nach Masse: gelb hinter der ersten Stufe, grün hinter der zweiten. So eine LED leuchtet umso heller, je höher die Ausgangsspannung ihrer Stufe ist.

## Probier das
1. Klick auf **Sim**. Steht der Knopf in der Mitte, leuchten beide LEDs mittelhell.
2. Dreh den Knopf langsam hoch. Welche LED wird dunkler, welche heller?
3. Dreh ganz nach unten und ganz nach oben. Gibt es eine Stellung, bei der beide hell sind?
4. Halte einen Spannungsmesser an den ersten Kollektor und dreh am Knopf. Steigt die Spannung oder fällt sie?

## Was passiert hier
Bekommt der erste Transistor mehr Basisstrom, zieht er mehr Strom durch seinen 1-kΩ-Kollektorwiderstand. Dadurch sinkt die Kollektorspannung, und die gelbe LED bekommt weniger ab. Das ist die invertierende Stufe: Eingang hoch, Ausgang runter. Die zweite Stufe nimmt diese fallende Spannung als Eingang und dreht sie noch einmal um – die grüne LED macht also dasselbe wie der Knopf. Zweimal umgedreht ist gar nicht umgedreht. Weil die Basiswiderstände groß sind, springen die Transistoren nie: Die Lampen werden weich heller und dunkler, wie bei einem Dimmer.

## Weiter geht's
- [lab-two-followers](../lab-two-followers) — zwei Stufen hintereinander, die nicht invertieren.
- [lab-ce-vs-follower](../lab-ce-vs-follower) — eine invertierende Stufe, mit Spannungsmessern nachgemessen.
