# Wer war zuerst? Ein Transistor-Duell

Zwei Spieler, zwei Taster, zwei LEDs und keine Software. Wer zuerst drückt, bringt seine LED zum Leuchten, und deren Spannung schaltet einen Transistor ein, der die LED des Gegners kurzschließt. Ein späterer Druck bewirkt dann nichts mehr, egal wie fest er ist.

**Vermittelt:** Latches als Schiedsrichter, kreuzgekoppelte Transistoren, Wettlaufsituationen

## Was zu tun ist

Alles sitzt auf einem Steckbrett. Klick auf **Sim**, dann halte den Taster von Spieler A gedrückt: Die rote LED leuchtet. Halte ihn weiter und drücke zusätzlich den Taster von Spieler B. Die grüne LED bleibt dunkel. Lass beide los und beginne noch einmal, diesmal mit B.

## Was du sehen solltest

- Der erste Druck gewinnt, und seine LED leuchtet, solange der Taster gehalten wird.
- Der Knoten der zweiten LED wird vom Transistor der Gegenseite nahe 0 V gehalten.
- Beide Taster loslassen setzt das Duell zurück.

## Warum es funktioniert

Jeder Taster ist die Versorgung einer Hälfte eines kreuzgekoppelten Paars. Die Hälfte, die zuerst Strom bekommt, schaltet den Transistor ein, der die andere Hälfte bewacht. Die andere Hälfte hat so keine Chance mehr. Die kleinen Basiskondensatoren geben der Schaltung ein Gedächtnis dafür, wer zuerst da war. Vergleiche das mit den Reaktionsduell-Programmen, in denen ein Mikrocontroller dieselbe Aufgabe in Software erledigt.
