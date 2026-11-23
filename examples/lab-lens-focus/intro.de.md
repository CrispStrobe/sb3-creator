# Eine Linse auf der Bank: das Bild finden

Eine Linse sammelt das Licht einer LED und bündelt es zu einem Bild. Schieb einen kleinen Lichtsensor über die Bank: Die Anzeige ist dort am größten, wo das Bild entsteht, und dieser Punkt folgt der Linsengleichung.

**Vermittelt:** Brennweite, die Linsengleichung 1/f = 1/g + 1/b

## Was zu tun ist

Klick auf **Sim** und dreh den Knopf langsam von einem Ende zum anderen. Beobachte dabei das Messgerät. Verschieb dann im Inspektor die Linse (`lensAtCm`) oder ändere ihre Brennweite (`lensFocalCm`) und such den neuen Höchstwert.

## Was du sehen solltest

- Die größte Anzeige, etwa 5,6 V, 45 cm von der LED entfernt.
- Etwa 1,5 V bei 35 cm und bei 55 cm.

## Warum es funktioniert

Steht die LED 15 cm vor einer Linse mit 10 cm Brennweite, legt die Linsengleichung das Bild 30 cm hinter die Linse. Dort trifft sich das Licht, das die Linse aufgefangen hat, im kleinsten Fleck, also fängt der kleine Sensor dort am meisten davon. Davor oder dahinter ist das Licht auf einen größeren Fleck verteilt.
