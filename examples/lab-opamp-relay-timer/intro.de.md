# Halbstunden-Zeitschalter mit Relais

Ein großer Kondensator lädt sich langsam über einen großen Widerstand auf; ein Op-Amp beobachtet ihn und hält ein Relais, bis er zwei Drittel der Versorgungsspannung überschritten hat. Mit dem Zeitknopf in der Mitte dauert das eine halbe Stunde.

**Vermittelt:** RC-Zeitglied, Komparator mit Hysterese, Relaistreiber

## Was zu tun ist

Klick auf **Sim**. Der Bereichsschalter (slide_switch_5) steht links, Minuten: die Lampe leuchtet und bleibt eine halbe Stunde an. Um es in Sekunden zu sehen, schieb ihn nach rechts (ein hundertmal kleinerer Kondensator) und drück START (button_8). Dreh am Zeitknopf (potentiometer_4) und drück noch einmal START.

## Was du sehen solltest

- Sekundenbereich, Knopf wie aufgebaut: die Lampe geht nach etwa 18 s aus. Minutenbereich: nach etwa 30 min.
- START leert den Kondensator, und die Zeit beginnt von vorn.
- Knopf aufgedreht: kürzer, bis etwa eine halbe Sekunde (etwa eine Minute im Minutenbereich); zugedreht: bis etwa 25 s (42 min).

## Warum es funktioniert

Der −-Eingang des Op-Amps folgt dem Kondensator, sein +-Eingang liegt bei 6 V. Solange der Kondensator darunter ist, ist der Ausgang hoch und der Transistor hält das Relais. Die Zeit bis 6 V beträgt etwa 1,1 × R × C — hundertmal so viel Kapazität ergibt hundertmal so viel Zeit.
