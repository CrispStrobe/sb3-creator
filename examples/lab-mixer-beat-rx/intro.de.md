# Pfeifende Sender: ein Mischer mit eigenem Oszillator

Der Mischer-Chip hat einen eigenen Transistor für einen Oszillator. In einen Schwingkreis eingebaut, schwingt er auf der Frequenz, die der Abstimmknopf ihm gibt. Eine Drahtantenne bringt die Sender direkt in den Mischer, und wo der Oszillator in die Nähe eines Senders kommt, kommt ihr Unterschied als Pfeifton aus dem Mischer.

**Vermittelt:** Überlagerungsoszillator, Überlagerungsempfang, Schwebungsnull

## Was zu tun ist

Klick auf **Sim** und hör am Anfang zu (Knopf auf 0,45). Dreh den Abstimmknopf dann langsam auf 0,53 und weiter auf 0,535.

## Was du sehen solltest

- Bei 0,45: nichts — kein Sender in der Nähe des Oszillators.
- Bei 0,53: ein Pfeifton von etwa 1 kHz.
- Bei 0,535: ein höherer Pfeifton, etwa 3 kHz. Irgendwo dazwischen fällt die Tonhöhe zu einem Brummen und auf null (Schwebungsnull).

## Warum es funktioniert

Der Mischer multipliziert das Antennensignal mit seinem Oszillator. Zwei Frequenzen multipliziert ergeben ihre Summe und ihre Differenz. Der Summe, über einem Megahertz, kann der Ohrhörer nicht folgen; die Differenz von einigen Kilohertz spielt er. Verstimmt man den Oszillator, ändert sich die Differenz, und die Tonhöhe gleitet mit dem Knopf.
