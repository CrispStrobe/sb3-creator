# Aktive Bass- und Höhenregelung

Dreh den Bass auf, und das Schlagzeug wird lauter; dreh die Höhen auf, und die Becken glitzern. Hier schafft das ein Operationsverstärker mit zwei Potis, und zwei Signalgeneratoren spielen einen tiefen und einen hohen Ton, damit du jeden einzeln sehen kannst.

**Vermittelt:** frequenzabhängige Gegenkopplung, Klangregelung (Baxandall), Kondensatoren bei verschiedenen Frequenzen

## Was zu tun ist

Klick auf **Sim** und öffne das Oszilloskop (Kanal 1 Eingang, Kanal 2 Ausgang). Dreh **BASS** auf und zu, dann **TREBLE**. Um einen Ton allein zu sehen, stell beim anderen Generator die Amplitude auf null.

## Was du sehen solltest

- Mittelstellungen: Der Ausgang sieht aus wie der Eingang.
- BASS auf: Die langsame 100-Hz-Welle wird etwa fünfmal größer, die schnelle bleibt.
- TREBLE auf: Die schnelle 5-kHz-Welle wird etwa zehnmal größer.

## Warum es funktioniert

Die Verstärkung legt das Netzwerk in der Gegenkopplung gegenüber dem am Eingang fest. Kondensatoren ändern das mit der Frequenz: Für den langsamen Basston sind die 22 nF fast offen, und das Basspoti entscheidet; für den schnellen hohen Ton sind sie fast ein Kurzschluss, das Basspoti zählt nicht mehr, und die 4,7 nF schalten stattdessen das Höhenpoti zu.
