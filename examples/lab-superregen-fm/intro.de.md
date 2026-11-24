# Pendelempfänger für UKW

Ein UKW-Transistor, den ein Pendelgenerator 25 000-mal in der Sekunde zum Schwingen bringt und wieder abschaltet. Bei jedem Start wächst seine Schwingung aus dem, was gerade im Kreis ist: mit einem Sender aus dessen Signal, ohne aus dem Wärmerauschen der Spule. Je stärker der Anfang, desto schneller hat die Schwingung ihre volle Größe — deshalb folgen der mittlere Strom und damit der Ton dem Sender. Ein einziger Transistor erreicht so eine riesige Verstärkung; zwischen den Sendern rauscht er.

**Vermittelt:** exponentielles Anwachsen einer Schwingung, Pendelung, Pendelrückkopplung, ein mit Kapazitätsdiode abgestimmter UKW-Kreis

## Was zu tun ist

Klick auf **Sim** und hör zu. Miss am Emitter: Die Pendelung zeigt sich als 25-kHz-Schwankung. Lösche den Sender der Antenne (ihren Parameter `stations`) und hör noch einmal hin.

## Was du sehen solltest

- Die HF im Kreis kommt in Stößen von einigen Volt, einer pro Pendelzyklus; dazwischen fällt sie nur bis auf das Niveau des Senders zurück (ein Zehntel Volt).
- Ohne Sender beginnen die Stöße beim Rauschen, jeder mit einer anderen zufälligen Größe, und der Ohrhörer rauscht.
- Mit dem Sender beginnt jeder Stoß im selben Augenblick des Pendelzyklus, und früh; aus dem Rauschen beginnt er etwas später und jedes Mal zu einem anderen Augenblick. Dieser wandernde Beginn ist das Rauschen eines Pendelempfängers, und der feste Beginn ist der Grund, warum ein Sender es leiser macht.
- In diesem Gerät ist die Wirkung auf den Ton klein: Seine Stöße wachsen so schnell, dass das Rauschen ihren Beginn nur um Bruchteile einer Mikrosekunde verschiebt. Die Simulation zeigt die Stöße und ihren Beginn; das schwache Programm und das Leiserwerden behauptet sie nicht.

## Warum es funktioniert

In jeder Hälfte des Pendelzyklus hat die Stufe mehr Verstärkung als Verluste: Die Schwingung im Kreis wächst exponentiell, in wenigen Mikrosekunden von Mikrovolt auf Volt. Wie lange das dauert, hängt davon ab, wo sie beginnt — logarithmisch vom Signal des Senders —, und davon hängt auch der mittlere gleichgerichtete Strom am Emitter ab. Das Filter aus 10 kΩ und 10 nF behält diesen Mittelwert und hält die Pendelfrequenz zurück; das ist der Ton. Die Sperrspannung der Kapazitätsdiode (das Poti) stimmt den Kreis ab; der UKW-Sender wird auf der Flanke seiner Resonanz empfangen.
