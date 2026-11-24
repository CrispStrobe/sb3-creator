# Licht in einen Lichtleiter bündeln

Eine LED 9 cm vor dem Ende eines Lichtleiters schickt fast nichts hinein: Ihr Licht breitet sich viel weiter aus als der 1 mm dünne Kern. Setz eine Linse dazwischen und schieb das Ende des Lichtleiters an die richtige Stelle, und das Messgerät am anderen Ende springt hoch.

**Vermittelt:** Licht in einen Lichtleiter einkoppeln, die Linsengleichung, die Linse an den Akzeptanzkegel des Lichtleiters anpassen

## Was zu tun ist

Klick auf **Sim** und lies das Messgerät ab. Dreh den Knopf langsam, um das Ende des Lichtleiters zu verschieben, und such die größte Anzeige. Lösch dann im Inspektor die Linse (`lensFocalCm`) und setz `inGapMm` auf 90, um zu vergleichen.

## Was du sehen solltest

- Etwa 4,1 V mit dem Lichtleiterende bei 9 cm.
- Ein paar Millimeter daneben: Die Anzeige fällt schnell.
- Ohne Linse: fast nichts.

## Warum es funktioniert

Die Linse zeichnet 3 cm hinter sich ein kleines Bild des leuchtenden LED-Chips (1/f = 1/g + 1/b mit f = 2 cm und g = 6 cm). Nur dort ist das Licht auf einen Fleck zusammengedrängt, der etwa so klein ist wie der Kern des Lichtleiters. Davor oder dahinter ist das Licht auf einen größeren Fleck verteilt, und das meiste verfehlt den Kern.
