# Berührungsloser Drehzahlmesser und Drehzahlregelung

Ein Magnet auf der Welle und ein Hallschalter zählen die Umdrehungen eines Motors, ohne ihn zu berühren. Aus den Impulsen wird eine Spannung am Messgerät: ein Drehzahlmesser. Vergleich sie mit einem Sollwert, schalte den Motor danach, und die Drehzahl bleibt, auch wenn du den Motor belastest.

**Vermittelt:** Frequenz-Spannungs-Wandlung, Rückkopplung, Regeln gegen Steuern

## Was zu tun ist

Klick auf **Sim** und beobachte das Messgerät. Belaste die Welle des Motors (sein Lastmoment) und sieh, wie sich die Drehzahl ändert. Stell dann den Schiebeschalter auf Gashebel, stell das Gashebel-Potentiometer ein und belaste den Motor noch einmal.

## Was du sehen solltest

- Geregelt: Der Motor pendelt sich bei etwa 180 rad/s ein; mit Last schwankt er um diese Drehzahl, hält sie aber im Mittel.
- Gashebel: Die Drehzahl folgt dem Gashebel-Potentiometer, und eine Last bremst ihn.
- Das Messgerät zeigt immer die Drehzahl.

## Warum es funktioniert

Jeder Impuls schiebt das gleiche kleine Ladungspaket in einen Kondensator, der sich über einen Widerstand entlädt; je schneller die Impulse, desto höher die Spannung. Der Operationsverstärker vergleicht sie mit dem Sollwert: zu langsam, der Treiber schaltet den Motor ein; zu schnell, aus. Belastet bekommt der Motor einfach öfter Strom. Ein Gashebel kann das nicht: Er gibt denselben Antrieb, egal wie groß die Last ist.
