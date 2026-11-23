# Licht wird Ton: Tongenerator mit Fototransistor

Ein Fototransistor lässt umso mehr Strom durch, je mehr Licht auf ihn fällt. Hier hilft er, den Zeitkondensator eines 555-Tongenerators zu laden: Mehr Licht heißt höherer Ton. Bewege die Hand darüber, und der Ton zwitschert auf und ab: ein kleines Licht-Theremin ganz ohne Mikrocontroller.

**Vermittelt:** ein Lichtsensor als lichtgesteuerter Strom, eine physikalische Größe wird zur Frequenz

## Was zu tun ist

Klick auf **Sim** und hör auf den Piezo. Bewege den Licht-Schieberegler des Fototransistors langsam auf und ab, dann schnell.

## Was du sehen solltest

- Dunkel: ein tiefes Brummen, etwa 285 Hz.
- Heller: höher, bis etwa 1,6 kHz bei vollem Licht.
- Schnelle Änderungen ergeben Zwitschern und Glissandi.

## Warum es funktioniert

Der Kondensator lädt sich über R1 und parallel dazu über den Fototransistor. Licht liefert zusätzlichen Strom, der Kondensator erreicht die obere Schwelle des 555 früher, und der Zyklus wiederholt sich schneller. R1 sorgt dafür, dass der Oszillator auch in völliger Dunkelheit weiterläuft.
