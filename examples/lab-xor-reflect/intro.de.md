---
level: advanced
age: 14+
prereqs: [lab-colour-sensor, lab-nand-pips]
teaches: [synchronous-detection, exclusive-or, nand-logic, infrared, light-barrier]
---
## Was du siehst
Eine Infrarot-LED, die etwa 570-mal pro Sekunde blitzt, eine weiße Fläche, die sie zurückwirft, einen Fototransistor, Logikgatter und einen Operationsverstärker. Eine grüne LED bedeutet „Gegenstand davor". Eine gelbe LED zeigt, was eine einfache Lichtschranke sehen würde.

## Was du tun kannst
1. Klick auf **Sim**. Die Fläche ist 2 cm entfernt: Die grüne LED leuchtet.
2. Dreh den **Abstand**-Knopf der Fläche ganz ans Ende. Die grüne LED geht aus.
3. Schieb jetzt den **Licht**-Schieber des Fototransistors (eine Lampe im Raum) bis zur Mitte. Die gelbe LED leuchtet, als wäre etwas da, aber die grüne bleibt dunkel.
4. Schalte die Lampe aus und hol die Fläche zurück: wieder grün.

## Was passiert hier
Vier NAND-Gatter bilden ein Exklusiv-ODER, das nur low ist, wenn seine beiden Eingänge übereinstimmen. Ein Eingang ist der Takt, der die LED blitzen lässt, der andere das, was der Fototransistor empfängt. Licht, das von der Fläche zurückkommt, ist genau im Takt, also stimmen beide immer überein. Eine Lampe gibt gleichmäßiges Licht, das nur die Hälfte der Zeit mit dem Takt übereinstimmt. Der Operationsverstärker mittelt das Ergebnis und entscheidet. Das ist Synchrondemodulation, der Trick hinter Fernbedienungen und störsicheren Lichtschranken.

## Weiter geht's
- [lab-colour-sensor](../lab-colour-sensor) — ein Reflexsensor ohne den Takt-Trick.
- [lab-light-link](../lab-light-link) — ein blinkender Lichtstrahl überträgt ein Signal.
