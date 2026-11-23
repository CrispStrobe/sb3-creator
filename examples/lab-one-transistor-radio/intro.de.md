# Ein-Transistor-Radio

Nimm den Detektorempfänger, lass die Diode weg und lass einen Transistor die Arbeit machen: Seine Basis-Emitter-Strecke gleichrichtet den Sender, und derselbe Transistor verstärkt den Ton in einen magnetischen Ohrhörer. Eine Batterie liefert jetzt die Leistung, die der Sender allein nicht hergibt.

**Vermittelt:** ein Transistorübergang als Gleichrichter, Verstärkung, Koppelwicklung, Arbeitspunkt

## Was zu tun ist

Klick auf **Sim** und hör in den Ohrhörer. Dreh am Abstimmknopf, um die beiden anderen Sender zu finden, und stell ihn dann zwischen zwei Sender.

## Was du sehen solltest

- Knopf auf 0,5: der 400-Hz-Ton des Ortssenders, deutlich lauter als beim Detektorempfänger.
- Knopf bei etwa 0,26: ein Sender, der zwischen 600 Hz und 900 Hz wechselt.
- Knopf auf 0,1: ein leiserer 1-kHz-Ton.
- Zwischen den Sendern wird es fast still.

## Warum es funktioniert

Die Spule hat eine zweite, kleine Wicklung, die den abgestimmten Träger an die Basis des Transistors weitergibt. Die Basis-Emitter-Strecke verhält sich wie eine Diode: Bei den positiven Schwingungen lässt sie mehr Strom durch als bei den negativen, daher wächst und schrumpft ihr mittlerer Strom mit dem Ton des Senders. Der Transistor vervielfacht diesen Strom mit seiner Verstärkung, und der Ohrhörer im Kollektor macht daraus einen Ton. Der 1-MΩ-Widerstand hält den Transistor gerade an der Schwelle zum Leiten, wo er am besten gleichrichtet; der 100-nF-Kondensator hält das untere Ende der kleinen Wicklung ruhig.
