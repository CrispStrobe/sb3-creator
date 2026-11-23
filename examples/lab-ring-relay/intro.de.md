# Das Telefon klingelt, die Lampe geht an

Ein Lautsprecher, der neben einem Telefon liegt, kann es klingeln hören. Verstärkt man, was er hört, macht aus den Schallstößen eine gleichmäßige Spannung und lässt damit ein Relais schalten, dann schaltet ein klingelndes Telefon eine Lampe ein: So funktioniert ein Lichtsignal-Klingel für eine laute Werkstatt.

**Vermittelt:** Lautsprecher als Mikrofon, Gleichrichten und Glätten, Schalten mit einem Relais

## Was zu tun ist

Klick auf **Sim**. Das Telefon klingelt: Beobachte Relais und Lampe. Zieh in der Instrumentenspalte den Regler **Schall** auf 0 (die Klingel hört auf), probier dann 80 (jemand spricht in der Nähe) und wieder 110.

## Was du sehen solltest

- Es klingelt: Das Relais zieht an, die Lampe leuchtet und bleibt an, solange es klingelt.
- Stille: Die Lampe geht nach einem Bruchteil einer Sekunde aus.
- Sprechen: Nichts passiert. Es braucht eine laute Klingel.

## Warum es funktioniert

Der Lautsprecher macht aus der Klingel ein paar Millivolt, der LM386 daraus etwa ein Volt. Zwei Dioden und ein Kondensator machen aus jedem Schallstoß eine Gleichspannung, die Strom in die Basis des Transistors schickt. Der Transistor schaltet das Relais, und dessen Kontakt, der mit dem Rest elektrisch nicht verbunden ist, schaltet die Lampe.
