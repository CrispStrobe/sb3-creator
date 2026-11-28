# Klopf-Detektor

**Vermittelt:** Schwingungsaufnehmer, Verstärker, Spitzenwertgleichrichter

## Was zu tun ist

Klick auf **Sim** und warte kurz: Die LED ist dunkel. Dann dreh den Geräuschregler des Aufnehmers (earphone_3) auf etwa 110 dB, als ob du kräftig auf den Tisch klopfst. Probier auch leises Klopfen (80 dB).

## Was du sehen solltest

- Kräftiges Klopfen: Die LED blitzt bei jedem Klopfen.
- Leises Klopfen: nichts.

## Warum es funktioniert

Der Kristallhörer verwandelt die Schwingung des Tisches in eine winzige Spannung. Der erste Transistor gibt sie weiter, ohne den Kristall zu belasten, der zweite verstärkt sie etwa hundertfach, und zwei Dioden machen aus dem verstärkten Stoß eine kurze Gleichspannung an einem Kondensator. Diese Spannung schaltet den dritten Transistor und die LED ein, bis sich der Kondensator wieder entladen hat.
