# Direktmischung: Wie stabil ist ein Oszillator?

Ein kleiner Sender auf einem Ferritstab sendet einen unmodulierten Träger. Der Empfänger ist ein Mischer-Chip mit eigenem Oszillator, der dicht daneben abgestimmt ist: Der Unterschied der beiden kommt direkt als Pfeifton heraus. Jede winzige Änderung eines der Oszillatoren hört man als andere Tonhöhe — ein guter Weg, herauszufinden, wie stabil ein Oszillator wirklich ist.

**Vermittelt:** Direktmischempfang, Schwebungsnull, Frequenzstabilität von Oszillatoren (Versorgung, Abstimmung)

## Was zu tun ist

Klick auf **Sim** und hör zu. Dreh den Abstimmknopf des Senders ein klein wenig, von 0,3 auf 0,302, dann auf 0,298. Stell ihn wieder auf 0,3, bevor du den Schalter **SUPPLY** von 9 V auf 6 V stellst.

## Was du sehen solltest

- Einen Pfeifton von etwa 3,9 kHz, sobald sich der Verstärker eingeschwungen hat.
- Bei 0,302 einen höheren Ton, etwa 6,2 kHz: Der Sender ist weiter unter den Empfänger gerückt. Bei 0,298 fällt der Ton auf etwa 1,5 kHz.
- Mit der Abstimmung wieder auf 0,3 hebt der Wechsel auf 6 V den Ton auf etwa 4,9 kHz: Die Frequenz des Senders hängt von seiner Spannung ab.

## Warum es funktioniert

Der Mischer multipliziert den Träger des Senders mit seinem eigenen Oszillator; die Differenzfrequenz von einigen Kilohertz geht zum Verstärker. Fallen beide Frequenzen zusammen, ist die Differenz null: Schwebungsnull. 1 kHz ist nur ein 800stel des Trägers, aber die ganze Tonhöhe des Pfeiftons. Die inneren Kapazitäten eines Transistors ändern sich mit seinem Strom, deshalb ziehen eine schwächer werdende Batterie, ein warmer Transistor oder eine Hand am Drehkondensator einen Oszillator weg — darum haben gute Sender stabilisierte Versorgungen und Pufferstufen.
