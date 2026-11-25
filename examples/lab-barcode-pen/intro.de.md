# Ein Reflexstift liest schwarze Striche: LED und Ton

Ein Stift, der liest: Eine LED beleuchtet das Papier, ein Fototransistor daneben sieht, wie viel zurückkommt. Über weißem Papier viel, über einem schwarzen Strich fast nichts. Transistoren machen daraus eine Lampe und einen Ton.

**Vermittelt:** Reflexabtastung, Transistorschalter, Strichcodes und Morsezeichen lesen

## Was zu tun ist

Klick auf **Sim**. Beweg den Regler des Lichtwegs (wie viel vom Lichtfleck auf einem schwarzen Strich liegt) von 0 auf 1 und zurück. Probier kurze und lange „Striche“, um Punkte und Striche zu senden.

## Was du sehen solltest

- Weißes Papier: Die gelbe LED ist dunkel, der Lautsprecher still.
- Schwarzer Strich: Die gelbe LED leuchtet, und ein Ton von etwa 410 Hz erklingt.

## Warum es funktioniert

Der Strom des Fototransistors folgt dem reflektierten Licht. Auf weißem Papier schaltet er Transistor 1 ein, der Transistor 2 (die LED) sperrt, und Transistor 3 schließt den Zeitkondensator des Oszillators kurz, so dass der LM386 nicht schwingen kann. Über einem schwarzen Strich hört der Strom auf, Transistor 1 lässt los, die LED geht an, Transistor 3 gibt den Kondensator frei, und der Oszillator ertönt. Das Abtasten einer Reihe von Strichen ergibt ein Muster aus Blinkzeichen und Pieptönen.
