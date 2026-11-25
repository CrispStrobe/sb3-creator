# Ein blockierter Motor schaltet seinen Antrieb selbst ab

Ein Motor, dessen Welle blockiert ist, zieht einen großen Strom und kann durchbrennen. Diese Schaltung misst den Motorstrom, wartet einen Moment, um sicher zu sein, und schaltet dann den Antrieb ab und eine Warn-LED ein, bis du zurücksetzt.

**Vermittelt:** Überstromschutz, Gegenspannung, Selbsthalteschaltungen

## Was zu tun ist

Klick auf **Sim** und lass den Motor laufen. Belaste dann die Welle des Motors kurz stark (sein Lastmoment) und nimm die Last wieder weg. Schalte zum Schluss den Hauptschalter aus und wieder ein.

## Was du sehen solltest

- Normaler Lauf: Die rote LED TRIP bleibt dunkel.
- Welle festgehalten: Nach Sekundenbruchteilen leuchtet TRIP, und der Motor bleibt stehen, auch wenn du loslässt.
- Hauptschalter aus und ein: Der Motor läuft wieder.

## Warum es funktioniert

Ein drehender Motor arbeitet als Generator gegen seine Versorgung und zieht deshalb wenig Strom. Steht er, fällt das weg, und der Strom springt hoch. Die Spannung am kleinen Messwiderstand lädt einen Kondensator; hält der Strom an, erreicht der Kondensator den Zündpunkt der Selbsthaltung. Die gezündete Selbsthaltung zieht ihre Anode nach unten und mit ihr den Antrieb des Verstärkers. Sie hält sich selbst, bis der Hauptschalter ihren Strom unterbricht.
