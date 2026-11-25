---
level: intermediate
age: 12+
prereqs: [lab-counter-timer]
teaches: [logic-threshold, bias, counter]
---
## Was du siehst
Ein Audiosignal (ein Funktionsgenerator steht für den Ohrhörerausgang eines Radios), ein Kondensator, ein Poti und ein Zähler mit vier LEDs. Die LEDs zählen schnell.

## Probier das
1. Klick auf **Sim**: Die LEDs laufen durch die Binärzahlen, 100 Schritte pro Sekunde.
2. Dreh im Inspektor die `amplitude` des Generators von 0,5 auf 0,1. Der Zähler bleibt stehen.
3. Wieder bei 0,5: Dreh das Schwellen-Poti auf 0,35. Er bleibt wieder stehen.

## Was passiert hier
Ein Zählereingang erkennt "hoch" erst oberhalb der halben Versorgungsspannung. Das Poti legt die Ruhespannung des Eingangs knapp unter diese Schwelle, und der Kondensator setzt das Audiosignal obendrauf. Nur wenn das Signal stark genug ist, erreichen seine Spitzen die Schaltschwelle, einmal pro Welle, und jedes Überschreiten wird gezählt. Dreht man das Poti herunter, rückt die Ruhespannung weiter weg, und das Signal muss lauter sein. Der Zähler selbst ist der Lautstärkedetektor.

## Weiter geht's
- [lab-octave-divider](../lab-octave-divider) — der Zähler als Frequenzteiler.
- [lab-counter-timer](../lab-counter-timer) — ein Zähler, der seinen eigenen Takt anhält.
