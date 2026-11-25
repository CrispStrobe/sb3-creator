# Der Synchrondemodulator: ein Sender mit sich selbst gemischt

Ein Mischer multipliziert zwei Signale. Bekommt er an beiden Eingängen denselben AM-Sender, multipliziert er den Träger mit sich selbst, im Gleichtakt: Jede Halbwelle kommt mit demselben Vorzeichen heraus, und übrig bleibt die Stärke des Trägers — das Programm. Eine Diode ist hier nicht im Spiel.

**Vermittelt:** Synchrondemodulation (Produktdetektor), ein Signal mit sich selbst mischen

## Was zu tun ist

Klick auf **Sim** und hör zu. Öffne dann den Schalter **SYNC** und hör wieder zu.

## Was du sehen solltest

- SYNC geschlossen: Der 1-kHz-Ton des Senders im Lautsprecher.
- SYNC offen: Stille. Der zweite Eingang des Mischers bekommt nichts, und allein kommt der erste Eingang nicht zum Ausgang durch.

## Warum es funktioniert

Der Schwingkreis sucht den Sender heraus. Seine Koppelwicklung gibt dem Mischer eine kleine Kopie, das obere Ende des Schwingkreises gibt dem Schalteingang eine große. Die große schaltet den Mischer genau im Takt des Trägers, also wird die kleine bei jeder negativen Halbwelle „umgedreht": Der Ausgang ist wie bei einem Zweiweggleichrichter. Sein Mittelwert ist die Stärke des Trägers, und die steigt und fällt mit dem Ton. Man nennt das einen Synchrondemodulator; bei schwachen Sendern verzerrt er weniger als eine Diode.
