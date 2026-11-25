# Applausmesser mit Leistungsverstärker

Ein Lautsprecher ist das Mikrofon, ein LM386 verstärkt, was er hört, und die Spitzen des Schalls werden in einem Kondensator gesammelt. Ein Transistor lässt aus diesem Kondensator eine grüne LED leuchten: Sie bleibt an, solange der Applaus dauert, und verlischt langsam, wenn er aufhört.

**Vermittelt:** Lautsprecher als Mikrofon, Spitzenwertgleichrichter, schnell laden und langsam entladen, Transistor als LED-Treiber

## Was zu tun ist

Klick auf **Sim**. Schieb in der Instrumentenspalte den Regler **Schall** am Lautsprecher auf 110 (lauter Applaus), lass ihn einen Moment dort und dann zurück auf 0. Probier auch 80 (Sprechen). Stell den Schiebeschalter HOLD um und klatsch noch einmal.

## Was du sehen solltest

- Sprechen: Die LED bleibt dunkel.
- Applaus: Die LED leuchtet und bleibt an; nach dem Applaus verlischt sie innerhalb etwa einer halben Sekunde.
- Mit HOLD auf dem großen Kondensator füllt er sich langsamer und glimmt über eine Sekunde nach.

## Warum es funktioniert

Der verstärkte Schall schwingt um die halbe Versorgungsspannung auf und ab. Zwei Dioden lassen nur die Aufwärtsschwünge Ladung in den Haltekondensator schieben, bei jeder Spitze ein wenig; nichts lässt sie zurückfließen. Der Kondensator entleert sich nur langsam, über einen großen Widerstand und die Basis des Transistors, also folgen Transistor und LED der mittleren Lautstärke der letzten Augenblicke. Ein größerer Kondensator braucht mehr Spitzen zum Füllen und länger zum Entleeren.
