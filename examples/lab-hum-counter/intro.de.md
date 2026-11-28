# Den Netzbrumm mit einem Stück Draht zählen

Ein Draht am Takteingang eines Binärzählers nimmt in der Nähe einer Netzleitung den 50-Hz-Brumm auf. Der Brumm schiebt den Eingang fünfzigmal pro Sekunde über die Schaltschwelle, und vier LEDs zählen binär: Der Zähler zählt das Stromnetz.

**Vermittelt:** kapazitive Einkopplung des Netzbrumms, hochohmige Eingänge, binäres Zählen

## Was zu tun ist

Klick auf **Sim**. Sieh den LEDs beim Zählen zu, drück **RESET** und bewege den Draht dann von der Netzleitung weg (seinen Regler Richtung 0).

## Was du sehen solltest

- Nahe am Netz: Der Zählerstand steigt um 50 pro Sekunde (nach 15 beginnt er von vorn).
- RESET setzt ihn auf 0.
- Draht weit weg: Das Zählen hört auf.

## Warum es funktioniert

Draht und Netzleitung bilden einen winzigen Kondensator von einigen Pikofarad. Mit 10 MΩ vom Eingang nach Masse erzeugt der Brumm am Eingang einige Volt, genug, um die Schwelle des Zählers in jeder Periode zu überschreiten. Deshalb darf man unbenutzte CMOS-Eingänge nie offen lassen: Sie zählen, was der Raum ihnen anbietet.
