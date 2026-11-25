# Direktmischung: Wie stabil ist ein Oszillator?

Ein kleiner Sender auf einem Ferritstab sendet einen unmodulierten Träger. Der Empfänger ist ein Mischer-Chip mit eigenem Oszillator, der dicht daneben abgestimmt ist: Der Unterschied der beiden kommt direkt als Pfeifton heraus. Jede winzige Änderung eines der Oszillatoren hört man als andere Tonhöhe — ein guter Weg, herauszufinden, wie stabil ein Oszillator wirklich ist.

**Vermittelt:** Direktmischempfang, Schwebungsnull, Frequenzstabilität von Oszillatoren (Versorgung, Abstimmung)

## Was zu tun ist

Klick auf **Sim** und hör zu. Dreh den Abstimmknopf des Senders ein klein wenig (0,302). Stell dann den Schalter **SUPPLY** von 9 V auf 6 V.

## Was du sehen solltest

- Einen Pfeifton von fast 6 kHz.
- Bei 0,302 einen höheren Ton, etwa 7 kHz: Der Sender hat sich vom Empfänger entfernt. Drehst du andersherum, sinkt der Ton zu einem Brummen und steigt wieder.
- An 6 V fällt der Ton auf etwa 1,2 kHz: Die Frequenz des Senders hängt von seiner Spannung ab.

## Warum es funktioniert

Der Mischer multipliziert den Träger des Senders mit seinem eigenen Oszillator; die Differenzfrequenz von einigen Kilohertz geht zum Verstärker. 1 kHz ist nur ein 800stel des Trägers, aber die ganze Tonhöhe des Pfeiftons. Die inneren Kapazitäten eines Transistors ändern sich mit seinem Strom, deshalb ziehen eine schwächer werdende Batterie, ein warmer Transistor oder eine Hand am Drehkondensator einen Oszillator weg — darum haben gute Sender stabilisierte Versorgungen und Pufferstufen.
