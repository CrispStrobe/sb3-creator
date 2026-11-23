# Bahnübergang: Speicher plus Blinker

Ein Bahnübergang für die Modellbahn aus zwei bekannten Bausteinen. Ein Kontakt vor dem Übergang setzt einen Speicher, ein Kontakt dahinter löscht ihn, und solange der Speicher gesetzt ist, läuft ein Blinker, der zwei rote Lampen abwechselnd leuchten lässt. Hier ist nichts programmiert.

**Vermittelt:** einen Speicher mit einem Oszillator verbinden, ereignisgesteuerte Schaltungen, Einschalt-Reset

## Was zu tun ist

Klick auf **Sim**. Beide Lampen sind dunkel. Halte einen Magneten an Kontakt A (schalte ihn ein und wieder aus): Die Lampen blinken abwechselnd. Mach es noch einmal: Nichts ändert sich. Halte jetzt einen Magneten an Kontakt B: Die Lampen hören auf.

## Was du sehen solltest

- Kontakt A: abwechselnd blinkende rote Lampen, etwa 1,4 Blitze pro Sekunde.
- Noch einmal Kontakt A: keine Änderung.
- Kontakt B: beide Lampen aus.

## Warum es funktioniert

Zwei kreuzgekoppelte NAND-Gatter merken sich, welcher Kontakt zuletzt geschlossen war. Ihr Ausgang steuert den Reset-Eingang des 555: hoch lässt ihn laufen, niedrig hält ihn an. Der Kondensator am Reset-Eingang sorgt dafür, dass der Übergang beim Einschalten ruhig bleibt.
