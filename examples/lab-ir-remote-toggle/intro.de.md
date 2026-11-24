---
level: advanced
age: 14+
prereqs: [lab-toggle-flip-flop, lab-amp-horn]
teaches: [infrared-remote, monoflop, toggle-flip-flop]
---
## Was du siehst
Ein Taster lässt eine Infrarot-LED aufblitzen. Ein Fototransistor fängt den Blitz auf, ein Audioverstärker-Chip macht daraus einen sauberen Impuls, und ein Flipflop aus zwei Transistoren schaltet bei jedem Druck zwischen einer roten und einer grünen LED um.

## Probier das
1. Klick auf **Sim** und warte kurz: Rot leuchtet.
2. Drück den Taster: Grün. Noch einmal: Rot. Halt ihn gedrückt: Es wird trotzdem nur einmal umgeschaltet.
3. Stell den Abstand am Lichtweg von 30 cm auf 1 m und drück. Außer Reichweite passiert nichts.

## Was passiert hier
Der Blitz hebt den Ausgang des Fototransistors an, und ein Kondensator gibt nur den Augenblick der Änderung an den Verstärker weiter. Der Verstärker ruht normalerweise unten; der Sprung kippt ihn nach oben, und ein zweiter Kondensator vom Ausgang zurück zum Eingang hält ihn dort ein paar hundertstel Sekunden lang, bevor er zurückfällt. Das ist ein Monoflop: ein Impuls pro Blitz, egal wie lange du drückst. Endet der Impuls, erreicht seine fallende Flanke beide Transistoren des Flipflops, aber eine Diode lässt sie nur zu dem durch, der gerade leitet, und der schaltet ab. Der andere übernimmt, bis zum nächsten Impuls.

## Weiter geht's
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — dasselbe Flipflop, mit einem Taster bedient.
- [lab-ir-beam-alarm](../lab-ir-beam-alarm) — derselbe Verstärker als lauter Alarm.
