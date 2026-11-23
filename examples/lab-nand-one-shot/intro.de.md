# Ein Druck, ein Piep: ein Gatter-Zeitschalter

Drück einen Taster, und ein Licht geht mit einem Piepton an, und kurz nachdem du loslässt, von selbst wieder aus. Vier NAND-Gatter, ein Kondensator und ein Widerstand schaffen das: Ein Gatter bemerkt den Druck, der Kondensator merkt ihn sich eine Weile, die anderen machen aus dieser Erinnerung Licht und Ton.

**Vermittelt:** Monoflop (Einmal-Zeitglied), RC-Entladung, Schmitt-Trigger, Torschaltung für einen Ton

## Was zu tun ist

Klick auf **Sim**. Drück kurz den Taster und zähl, wie lange die LED leuchtet. Halte den Taster dann ein paar Sekunden gedrückt, bevor du loslässt.

## Was du sehen solltest

- Einen Piepton von etwa 570 Hz zusammen mit der grünen LED.
- Beides hört knapp eine Sekunde nach dem Loslassen auf, egal wie lange du gedrückt hast.

## Warum es funktioniert

Der Druck auf den Taster lädt den Kondensator über die Diode fast sofort auf. Nach dem Loslassen kann er sich nur langsam über den 1-MΩ-Widerstand entladen. Gatter 2 beobachtet seine Spannung, und sein Schmitt-Trigger-Eingang schaltet sauber genau einmal um, wenn die Spannung unter die untere Schwelle fällt. Gatter 3 und 4 schalten mit diesem Signal einen Tonoszillator ein und aus. Ein größerer Kondensator oder Widerstand macht den Piepton länger.
