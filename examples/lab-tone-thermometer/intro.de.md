---
level: advanced
age: 14+
prereqs: [lab-wheatstone-bridge, lab-phase-shift]
teaches: [bridge, null-detector, junction-thermometer, temperature-coefficient, audio-amplifier]
---
## Was du siehst
Ein Audio-Verstärkerchip als Tongenerator, eine Brücke aus einem Trimmer, zwei Widerständen und zwei Transistoren, und ein Ohrhörer quer über die Mitte der Brücke. Neben jedem Transistor sitzt ein kleiner Heizwiderstand mit eigenem Taster.

## Probier das
1. Klick auf **Sim** und hör in den Ohrhörer: Stille, obwohl der Tongenerator läuft. Halte einen Tastkopf an den Ausgang des Verstärkers, dann siehst du den Ton.
2. Halte den ersten Heiztaster gedrückt: Er wärmt den Transistor in der oberen Reihe. Nach einem Moment ist der Ton im Ohrhörer zu hören.
3. Halte weiter gedrückt und dreh den Trimmer langsam hoch, bis etwa 0,85. Such die Stelle, an der der Ohrhörer wieder still wird.
4. Drück jetzt zusätzlich den zweiten Taster; er wärmt den anderen Transistor. Der Ton kommt zurück. Wo liegt die stille Stelle jetzt?

## Was passiert hier
Die Basis-Emitter-Strecke eines Transistors ist ein kleines Thermometer: Bei gleichem Strom sinkt ihre Spannung um ein paar Millivolt pro Grad Erwärmung. Die Brücke vergleicht zwei solche Strecken. Solange beide gleich warm sind und gleich viel Strom bekommen, bewegen sich beide Enden des Ohrhörers im Takt des Tons gemeinsam auf und ab, und der Ohrhörer hört nichts: Die Brücke ist abgeglichen. Wird ein Transistor wärmer, sackt sein Ende bei jedem Tonimpuls ein wenig ab – der Ohrhörer bekommt eine kleine Rechteckspannung, und du hörst den Ton. Drehst du den Trimmer, bekommt der warme Transistor mehr Strom, und seine Spannung steigt wieder: An der neuen stillen Stelle gleicht das Stromverhältnis den Temperaturunterschied genau aus. Werden beide warm, bleibt kein Unterschied zum Hören übrig. Dein Ohr ist das Messgerät, und die Stille ist der Messwert.

## Weiter geht's
- [lab-wheatstone-bridge](../lab-wheatstone-bridge) — derselbe Abgleich mit Messinstrument und Batterie.
- [lab-diff-pair](../lab-diff-pair) — noch eine Schaltung, die nur den Unterschied zwischen zwei Transistoren beachtet.
