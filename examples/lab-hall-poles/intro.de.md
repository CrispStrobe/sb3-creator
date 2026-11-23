# Hallsensor: Nord, Süd und Feldstärke

Ein Hallsensor gibt ohne Magnet in der Nähe die halbe Versorgungsspannung aus. Der eine Magnetpol schiebt den Ausgang nach oben, der andere nach unten, und ein stärkeres Feld schiebt ihn weiter. Zwei Komparatoren links und rechts der Ruhespannung unterscheiden Nord und Süd, und ein Messgerät mit Nullpunkt in der Mitte zeigt, wie stark das Feld ist.

**Vermittelt:** den Halleffekt, Vergleich mit zwei Schwellen (ein Fenster), Nullpunkt und Vorzeichen

## Was zu tun ist

Klick auf **Sim**. Der Feld-Regler des Hallsensors steht auf +0,5: Die rote LED NORD leuchtet, und der Zeiger steht rechts. Schieb den Regler über null bis −0,5 und beobachte, wie die LEDs wechseln und der Zeiger zur anderen Seite schwingt.

## Was du sehen solltest

- Nordpol: rote LED, Zeiger rechts.
- Südpol: grüne LED, Zeiger links.
- Schwaches Feld: keine LED, Zeiger nahe der Mitte.

## Warum es funktioniert

Der Ausgang des Sensors ruht bei 2,5 V. Die Schwellen bei 3,0 V und 2,0 V bilden ein Fenster um diese Ruhespannung, sodass nur ein deutliches Feld in eine der beiden Richtungen eine LED schaltet. Das Messgerät misst die Abweichung von 2,5 V und kann deshalb beide Richtungen anzeigen.
