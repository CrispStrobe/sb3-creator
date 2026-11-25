---
level: intermediate
age: 12+
prereqs: [lab-diff-pair]
teaches: [op-amp, comparator, open-loop-gain]
---
## Was du siehst
Ein Operationsverstärker, bei dem nichts vom Ausgang zu den Eingängen zurückführt. Ein Eingang liegt auf halber Betriebsspannung, der andere kommt von einem Drehknopf, der ihn nur um wenige Hundertstel Volt verstellen kann. Eine rote und eine grüne LED zeigen, wohin der Ausgang gekippt ist.

## Probier das
1. Klick auf **Sim**. Der Knopf ist ein wenig nach links gekippt: Rot leuchtet.
2. Dreh den Knopf langsam zur Mitte hin. Kurz davor (bei etwa 0,45) springt das Licht auf Grün: Die winzigen Eingangsströme des Operationsverstärkers verschieben den Kipppunkt.
3. Versuch genau dort anzuhalten, wo beide LEDs glimmen. Dafür brauchst du eine sehr ruhige Hand: Der ganze Wechsel passiert innerhalb eines Tausendstels der Drehung.
4. Fahr mit der Maus über den Schleifer des Knopfs und den Minus-Eingang und sieh nach, wie wenige Millivolt sie trennen.

## Was passiert hier
Ein Operationsverstärker vervielfacht den Unterschied zwischen seinen beiden Eingängen mit einer riesigen Zahl, hier mit etwa hunderttausend. Ohne Rückkopplung, die ihn bändigt, reicht schon ein Zehntel Millivolt Unterschied, und der Ausgang schlägt ganz nach oben oder ganz nach unten aus. Er benimmt sich wie eine Wippe, die beim kleinsten Ungleichgewicht ganz kippt: Er vergleicht zwei Spannungen und zeigt, welche höher ist. Deshalb überstreicht der Knopf hier nur wenige Millivolt; mit einem Knopf über die ganze Betriebsspannung wäre der Kipppunkt kaum zu treffen.

## Weiter geht's
- [lab-diff-pair](../lab-diff-pair) — das Transistorpaar am Eingang jedes Operationsverstärkers.
- [lab-ramp-timer](../lab-ramp-timer) — drei Operationsverstärker als Komparatoren an einer Rampe.
