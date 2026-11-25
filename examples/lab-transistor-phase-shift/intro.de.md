# Ein Phasenschieber-Oszillator mit nur einem Transistor

Ein Transistorverstärker stellt sein Signal auf den Kopf. Schick es über drei kleine Kondensator-Widerstand-Stufen zum Eingang zurück, die es bei einer bestimmten Frequenz noch einmal umdrehen, und der Verstärker hält sich genau bei dieser Frequenz selbst in Gang.

**Vermittelt:** Phasenverschiebung, RC-Glieder, rückgekoppelter Oszillator

## Was zu tun ist

Klick auf **Sim** und hör auf den Ohrhörer. Vergleich am Oszilloskop den Kollektor (Kanal 1) mit der Basis (Kanal 2).

## Was du sehen solltest

- Einen Ton von etwa 670 Hz.
- Das Signal an der Basis ist klein, das am Kollektor groß.

## Warum es funktioniert

Jede Kondensator-Widerstand-Stufe lässt das Signal etwas früher und etwas schwächer durch. Drei davon verschieben es bei einer Frequenz um eine halbe Schwingung. Der Transistor dreht um eine weitere halbe Schwingung (er invertiert) und gleicht den Verlust aus; nach einem Umlauf ist das Signal wieder im Takt mit sich selbst: ein Oszillator.
