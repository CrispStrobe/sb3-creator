---
level: beginner
age: 8+
prereqs: [12-dual-blink]
teaches: [sequencing, state-machine, multi-output]
---
## Was du siehst
Drei LEDs — rot, gelb und grün — durchlaufen die Standard-Ampelsequenz. Grün leuchtet am längsten, dann kurz gelb, dann rot, dann rot und gelb zusammen, bevor es wieder grün wird. Jede Phase hat ihre eigene Dauer.

## Probier das
1. Starte das Programm und beobachte die Reihenfolge: grün, gelb, rot, rot+gelb, grün.
2. Verkürze die Grünphase und sieh zu, wie der Zyklus schneller wird.
3. Versuche, eine „blinkendes Gelb"-Phase einzubauen, indem du die gelbe LED ein paar Mal umschaltest, bevor es auf Grün wechselt.

## Was passiert hier
Eine Ampel ist ein Zustandsautomat: Das System befindet sich immer in genau einem Zustand (grün, gelb, rot oder rot+gelb) und wechselt nach einer festen Zeit in den nächsten. Jeder Zustand setzt bestimmte Ausgänge auf HIGH und andere auf LOW. Das unterscheidet sich vom Blinken, wo ein einzelner Ausgang wechselt — hier ändern sich drei Ausgänge in einem koordinierten Muster. Die Rot+Gelb-Phase vor Grün ist bei europäischen Ampeln üblich und gibt Fahrern Zeit, sich vorzubereiten.

## Warum das wichtig ist
Zustandsautomaten sind eine der mächtigsten Ideen in der Embedded-Programmierung. Jedes System mit verschiedenen Modi — eine Waschmaschine, ein Getränkeautomat, ein Roboter — ist ein Zustandsautomat. Dieses Projekt lehrt dich, in Zuständen und Übergängen zu denken statt nur in „an und aus".

## Weiter geht's
- [12-dual-blink](../12-dual-blink) — zwei LEDs koordinieren, die einfachere Vorstufe.
- [13-sos-morse](../13-sos-morse) — eine weitere getimte Sequenz, die aber Information codiert.
- Experiment: Füge einen Fußgängerknopf hinzu, der die Ampel nach einer Mindest-Grünphase auf Rot zwingt.
