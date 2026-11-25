# Gepulstes Infrarot und ein drahtloser Dimmer

Ein Sender, der nur kurz aufblitzt, schont die Batterie. Und werden die Blitze länger, sieht ein Empfänger, der sie mittelt, mehr Licht: Die Blitzlänge wird zur Dimmerstellung.

**Vermittelt:** Pulsbreite, Tastverhältnis, integrierender Empfänger

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf von 0,2 auf 0,8 und beobachte die grüne LED am Empfänger.

## Was du sehen solltest

- Kurze Blitze: Grün dunkel, und der Sender braucht wenig Strom.
- Lange Blitze: Grün leuchtet.

## Warum es funktioniert

Zwei Dioden geben dem Zeitkondensator getrennte Wege zum Laden und Entladen, und der Knopf teilt seine Bahn zwischen beiden auf: Die Periode bleibt ungefähr gleich, während der 'Ein'-Anteil wächst. Am Empfänger schiebt jeder Blitz Ladung in einen Kondensator, der zwischen den Blitzen ausläuft, also folgt seine Spannung dem Anteil der Zeit, in dem Licht da war.
