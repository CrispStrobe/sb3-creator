# Optischer Drehzahlmesser: Eine Schlitzscheibe unterbricht einen Lichtleiter

Ein kleines Solarmodul treibt einen Motor. Auf seiner Welle sitzt eine Scheibe mit vier Schlitzen, die sich zwischen den Enden eines Lichtleiters dreht: An einem Ende leuchtet eine LED hinein, am anderen schaut ein Fototransistor heraus. Jeder vorbeikommende Schlitz lässt einen Lichtblitz durch. Ein Verstärkerchip macht aus jedem Blitz ein Klicken im Lautsprecher, und eine Diodenpumpe macht aus den Klicks einen Zeigerausschlag.

**Vermittelt:** optische Drehzahlmessung, Impulse pro Umdrehung, Frequenz-Spannungs-Wandlung mit einer Diodenpumpe

## Was zu tun ist

Klick auf **Sim**. Ändere das Licht auf dem Solarmodul, beobachte die Drehzahl, hör auf die Klicks und lies das Messgerät ab.

## Was du sehen solltest

- Volles Licht: Der Motor läuft mit etwa 225 rad/s (36 Umdrehungen pro Sekunde), und der Lautsprecher brummt mit etwa 145 Hz: vier Klicks pro Umdrehung.
- Weniger Licht: Der Motor wird langsamer, das Brummen tiefer, und das Messgerät zeigt weniger an.

## Warum es funktioniert

Jeder Schlitz gibt den Lichtleiter kurz frei, also liefert der Fototransistor einen Impuls pro Schlitz. Ein Koppelkondensator lässt nur die Impulse zum LM386 durch, der sie für den Lautsprecher verstärkt. Vom selben Ausgang schieben ein 100-nF-Kondensator und zwei Dioden pro Impuls eine feste Ladung in einen Widerstand und einen Kondensator: Je mehr Impulse pro Sekunde, desto höher die Spannung am Messgerät. Fahrradtachos, Drucker-Encoder und alte Mausräder zählen Schlitze genauso.
