# FSK: Zwei Töne werden von einer PLL wieder zu 0 und 1

Daten können als Schall reisen: Ein Ton bedeutet 0, ein anderer 1. Hier sendet ein Transistoroszillator die Töne, und eine Phasenregelschleife (PLL) hört zu. Sie folgt dem Ton, der gerade ankommt, und ihre Steuerspannung, von einem Verstärker bewertet, lässt die LED „0“ oder „1“ leuchten.

**Vermittelt:** Frequenzumtastung, die PLL als Demodulator, wie Modems arbeiten

## Was zu tun ist

Klick auf **Sim**. Halte den Tasten-Taster kurz gedrückt und lass ihn dann los. Fahr mit der Maus über den PLL-Baustein, um seine Frequenz zu sehen.

## Was du sehen solltest

- Taste oben: etwa 700 Hz, die grüne LED „0“ leuchtet.
- Taste gedrückt: etwa 920 Hz, die gelbe LED „1“ leuchtet.
- Losgelassen: wieder „0“.

## Warum es funktioniert

Die Taste ändert einen Zeitwiderstand des Multivibrators, er springt also zwischen zwei Frequenzen. Die PLL hält ihren eigenen Oszillator im Takt mit dem ankommenden Ton; um dem höheren Ton zu folgen, muss sie ihre Steuerspannung erhöhen. Diese Spannung ist deshalb die Nachricht: tief für 0, hoch für 1. Der LM386 vergleicht sie mit einer festen Schwelle und treibt die beiden LEDs. Alte Heimcomputer haben ihre Programme genauso auf Kassetten gespeichert.
