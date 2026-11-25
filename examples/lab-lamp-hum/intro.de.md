# Eine Netzlampe brummt mit 100 Hz, eine Taschenlampe ist still

Halte einen Lichtleiter an eine Lampe, die am Stromnetz hängt, und hör dem Licht zu: Es brummt. Eine Taschenlampe, genauso hell, bleibt still. Der Unterschied ist ein Flackern, das du nicht sehen kannst.

**Vermittelt:** Netzfrequenz, Flackern, Koppelkondensatoren

## Was zu tun ist

Klick auf **Sim** und hör zu. Stell dann den Schiebeschalter von Netz auf Taschenlampe.

## Was du sehen solltest

- Netz: ein tiefes Brummen mit 100 Hz.
- Taschenlampe: Stille, obwohl die Lampe leuchtet.

## Warum es funktioniert

Netzstrom wechselt 50-mal pro Sekunde die Richtung, also fällt der Strom durch eine Lampe 100-mal pro Sekunde auf null, und ihr Licht wird jedes Mal kurz schwächer. Der Fototransistor macht aus diesen Einbrüchen einen Strom, der 100-mal pro Sekunde steigt und fällt, und Transistor und LM386 machen das hörbar. Das Licht der Taschenlampe ist gleichmäßig, und die Kondensatoren zwischen den Stufen lassen nur Änderungen durch, also kommt am Lautsprecher nichts an.
