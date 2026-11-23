# Reflexempfänger: ein Transistor, zweimal benutzt

Der Reflextrick holt die Arbeit von zwei Transistoren aus einem heraus. Der Transistor verstärkt zuerst den schwachen Träger von der Antenne; eine Diode gewinnt daraus den Ton zurück; und der Ton wird in denselben Transistor zurückgeschickt, der ihn ein zweites Mal für den Ohrhörer verstärkt.

**Vermittelt:** HF- und NF-Verstärkung in einer Stufe, Drosseln und Abblockkondensatoren, Trennung nach Frequenz

## Was zu tun ist

Klick auf **Sim** und hör hin. Dreh dann den Abstimmknopf auf etwa 0,26 für den zweiten Sender.

## Was du sehen solltest

- Ein lauter 400-Hz-Ton vom Ortssender, obwohl dieser Aufbau nur einen kurzen Antennendraht hat.
- Bei etwa 0,26: 600 Hz und 900 Hz im Wechsel.
- Fast ganz unten am Knopf kommt der ferne Sender nicht sauber herein: Ein stärkerer Sender schlägt durch. Ein einziger Schwingkreis reicht nicht, wenn die Verstärkung so hoch ist.

## Warum es funktioniert

Derselbe Transistor sieht gleichzeitig zwei sehr verschiedene Frequenzen, und die Schaltung um ihn herum behandelt sie verschieden. Für den Träger, Hunderte Kilohertz, ist die Drossel im Kollektor ein großer Widerstand, also wird der Träger verstärkt, und ein kleiner 1-nF-Kondensator gibt ihn an die Diode weiter. Für den Ton, einige hundert Hertz, ist die Drossel fast ein Draht, der große Emitterkondensator hebt die bremsende Wirkung des Emitterwiderstands auf, und der Ohrhörer ist die Last. Der Ausgang der Diode geht über 100 nF zurück zur Basis, also verstärkt der Transistor auch den Ton. Zwei Durchgänge, ein Transistor.
