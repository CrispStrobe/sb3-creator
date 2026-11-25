---
level: advanced
age: 15+
prereqs: [lab-diff-comparator]
teaches: [negative-feedback, phase-delay, oscillation, miller-compensation, stability]
---
## Was du siehst
Das Differenzpaar und der Audio-Verstärkerchip aus dem Komparator-Aufbau. Der Ausgang des Verstärkers lässt eine grüne LED leuchten und führt außerdem zum anderen Eingang des Paars zurück – über drei Widerstände mit je einem Kondensator dahinter. Ein Schiebeschalter kann noch einen weiteren, kleineren Kondensator zwischen den Ausgang und den Minus-Eingang des Verstärkers legen.

## Probier das
1. Klick auf **Sim**. Die LED blinkt ein paar Mal pro Sekunde.
2. Halte einen Tastkopf an den Ausgang des Verstärkers und einen an die Basis, die von der Verzögerungskette kommt. Wie spät folgt das zweite Signal dem ersten?
3. Leg den Schalter um. Schau auf die LED: Sie wandert, pendelt noch einmal sanft und bleibt dann bei einer Helligkeit.
4. Schalte zurück. Kommt das Blinken wieder?

## Was passiert hier
Die Rückkopplung soll die Schaltung eigentlich ruhig halten: Ist der Ausgang zu hoch, drückt die verzögerte Kopie davon das Paar in die andere Richtung und holt ihn wieder herunter. Jede Widerstand-Kondensator-Stufe lässt diese Kopie aber später ankommen. Der Komparator reagiert sofort und mit riesiger Verstärkung – bis die Korrektur eintrifft, ist der Ausgang längst ganz oben und schießt dann ans andere Ende. Zu spät und zu stark: Das ist ein Oszillator. Der kleine Kondensator am Verstärker ändert den zweiten Teil. Er lässt den Ausgang nur noch langsam wandern, Stück für Stück. Jetzt kommt die Korrektur rechtzeitig an, bevor der Ausgang weit überschießt, und nach einem sanften Pendeln kommt die Schleife dort zur Ruhe, wo beide Basen gleich hoch liegen. Jeder Operationsverstärker-Chip hat aus genau diesem Grund so einen Kondensator eingebaut.

## Weiter geht's
- [lab-diff-comparator](../lab-diff-comparator) — dasselbe Paar mit Verstärker, ohne Rückkopplung.
- [lab-phase-shift](../lab-phase-shift) — eine Verzögerungskette, absichtlich benutzt, um einen Sinuston zu erzeugen.
