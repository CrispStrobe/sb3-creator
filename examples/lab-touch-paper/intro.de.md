# Berührung durch Papier

Ein NPN- und ein PNP-Transistor hintereinander vervielfachen einen winzigen Strom etwa 40 000-fach. Ihr Eingang ist eine Metallplatte unter einem Blatt Papier. Drück den Finger aufs Papier, und die LED leuchtet, solange die Schaltung an einem Netzteil hängt.

**Vermittelt:** kapazitive Kopplung, Komplementärverstärker, warum netzbetriebene Geräte Berührung spüren

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf der Platte von 0 (Finger weg) auf 1 (Finger aufs Papier gedrückt) und zurück. Stell dann `adaptorFarads` der Sonde auf 0 (Batterie statt Netzteil) und versuch es noch einmal.

## Was du sehen solltest

- Am Netzteil: Die LED glimmt in Ruhe schwach und leuchtet viel heller, solange du drückst, flackernd mit 50 Hz.
- An der Batterie: Drücken bewirkt nichts.

## Warum es funktioniert

Durch das Papier bilden Finger und Platte einen Kondensator von etwa 20 pF. Ein Netzteil hängt über seine eigene kleine Kapazität am Netz, darum schwingt die ganze Schaltung um etwa 150 V gegen die Erde, auf der du stehst. Dein Finger schließt diesen Kreis: 50-Hz-Strom fließt durchs Papier in die Basis des NPN, und das Transistorpaar macht aus seinen positiven Halbwellen einen LED-Strom. An der Batterie schwebt die Schaltung mit dem Raum, und fast nichts fließt.
