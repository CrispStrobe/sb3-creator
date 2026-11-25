# Ein klingelndes Telefon schaltet eine Lampe

Ein Lautsprecher lauscht auf eine Telefonklingel. Ein Transistor und ein Op-Amp verstärken, was er hört; klingelt es laut genug, zieht ein Relais an und schaltet eine Lampe — stellvertretend für jedes Gerät, das die Klingel schalten soll.

**Vermittelt:** Mikrofonverstärker, Hüllkurvendetektor, Komparator, Relais

## Was zu tun ist

Klick auf **Sim**. Stell den Schallpegel am Lautsprecher (speaker_3) auf ein leises Klingeln, etwa 70 dB, und beobachte Relais und Lampe. Erhöhe auf ein lautes Klingeln, etwa 85 dB. Stell dann wieder auf Stille. Der Empfindlichkeitsknopf (potentiometer_24) legt fest, wie laut laut genug ist.

## Was du sehen solltest

- Leises Klingeln: nichts schaltet.
- Lautes Klingeln: das Relais zieht innerhalb einer Zehntelsekunde an, und die Lampe leuchtet.
- Stille: kurz darauf fällt das Relais wieder ab.

## Warum es funktioniert

Der Lautsprecher liefert Bruchteile eines Millivolts. Die Transistorstufe und die Op-Amp-Stufe vervielfachen das um einige Tausend. Zwei Dioden und ein Kondensator machen aus dem verstärkten Klingeln eine Gleichspannung, die seiner Lautstärke folgt; ein zweiter Op-Amp vergleicht sie mit der des Knopfs und schaltet den Relaistransistor.
