# Belichtungsuhr: Das Licht bestimmt die Zeit

Eine Kamera oder ein Vergrößerer braucht bei hellem Licht eine kürzere Belichtung, bei schwachem Licht eine längere. Diese Uhr macht das von selbst: Ein Fototransistor entlädt den Zeitkondensator eines LM386-Monoflops, und je heller das Licht, desto schneller.

**Vermittelt:** Monoflop (monostabile Kippstufe), Fototransistor als lichtgesteuerter Strom, Belichtungsuhr

## Was zu tun ist

Klick auf **Sim**. Stell den Lichtregler des Fototransistors ein, drück den Taster und stopp die Zeit der grünen LED. Probier schwaches und helles Licht.

## Was du sehen solltest

- Rot, solange die Uhr bereit ist, Grün während der Belichtung.
- Licht auf 0,2: etwa 1 Sekunde Grün. Licht auf 0,6: etwa 0,4 Sekunden. Volles Licht: etwa eine Viertelsekunde.
- Im Dunkeln dauert es mehrere Sekunden.

## Warum es funktioniert

Der Taster hebt den Plus-Eingang des Verstärkers an, sein Ausgang springt hoch, und der Kondensator vom Ausgang hält den Plus-Eingang oben. Der Fototransistor zieht dann Ladung aus dem Kondensator; ist der Plus-Eingang unter die feste Spannung am Minus-Eingang gefallen, springt der Ausgang auf Rot zurück. Ein Fototransistor lässt umso mehr Strom durch, je mehr Licht er bekommt, deshalb endet die Belichtung bei hellem Licht früher.
