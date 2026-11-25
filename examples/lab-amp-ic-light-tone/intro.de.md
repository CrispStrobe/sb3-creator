# Lichtgesteuerter Ton

Ein LM386-Verstärker erzeugt einen Ton, und ein Fototransistor im Zeitglied bestimmt die Tonhöhe: im Dunkeln tief, im Licht hoch. Bewegst du die Hand über dem Fototransistor, schwingt der Ton auf und ab wie eine quakende Ente.

**Vermittelt:** Fototransistor als lichtgesteuerter Strom, Tonhöhe eines RC-Oszillators, ein Verstärker als Tongenerator

## Was zu tun ist

Klick auf **Sim** und hör zu. Bewege den Lichtregler des Fototransistors auf und ab. Stell dann den Schiebeschalter auf den größeren Kondensator.

## Was du sehen solltest

- Dunkel: ein Ton von etwa 680 Hz.
- Licht auf 0,3: etwa 1,7 kHz. Volles Licht: etwa 1,9 kHz.
- Mit dem größeren Kondensator ist jeder Ton etwa fünfmal tiefer.

## Warum es funktioniert

Der Ausgang des Verstärkers kippt jedes Mal, wenn die Kondensatorspannung einen von zwei Schaltpunkten erreicht. Der Kondensator lädt sich über einen Widerstand und parallel dazu über den Fototransistor, der umso mehr Strom durchlässt, je mehr Licht er bekommt. Mehr Licht, schnelleres Laden, früheres Kippen: ein höherer Ton.
