---
level: advanced
age: 14+
prereqs: [lab-led-sensor-colours, lab-counter-timer]
teaches: [infrared-remote, monoflop, toggle-flip-flop, relay]
---
## Was du siehst
Ein Taster lässt eine Infrarot-LED aufblitzen. Ein Stück entfernt fängt ein Fototransistor den Blitz auf, ein Operationsverstärker macht daraus einen sauberen Impuls, und die erste Stufe eines Zählers schaltet bei jedem Druck ein Relais um. Das Relais schaltet eine Lampe.

## Probier das
1. Klick auf **Sim** und warte kurz. Drück den Taster: Die Lampe geht an.
2. Drück noch einmal: Die Lampe geht aus. Halt den Taster gedrückt: Es wird trotzdem nur einmal umgeschaltet.
3. Stell den Abstand am Lichtweg von 30 cm auf 1 m und drück. Außer Reichweite passiert nichts.

## Was passiert hier
Der Blitz zieht den Empfängertransistor nach unten, solange der Taster gedrückt ist. Ein Kondensator lässt nur den Augenblick der Änderung durch, einen kurzen Einbruch, und der kippt den Operationsverstärker. Sein eigener Kondensator hält ihn etwa 40 Millisekunden lang gekippt, dann kehrt er von selbst zurück: ein Monoflop, ein Impuls pro Blitz, egal wie lange du drückst. Der Impuls taktet die erste Stufe eines Binärzählers, die bei jedem Impuls einfach ihren Zustand wechselt: an, aus, an, aus. Diese Stufe steuert einen Transistor und das Relais. Eine Fernbedienung funktioniert nach derselben Idee, nur mit verschlüsselten Blitzfolgen statt einzelner Blitze.

## Weiter geht's
- [lab-barrier-counter](../lab-barrier-counter) — Unterbrechungen einer Lichtschranke zählen und nach sechs ein Relais schalten.
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — ein Umschalt-Flipflop aus zwei Transistoren.
