---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc06-rc-charge]
teaches: [monostable, one-shot, schmitt-trigger, rc-time-constant]
---
## Was du siehst
Zwei Transistoren, eine rote und eine grüne LED, ein großer Kondensator und ein Taster. Rot ist der Ruhezustand. Ein Druck auf den Taster schaltet für ein paar Sekunden auf Grün, wie bei einer Fußgängerampel.

## Probier das
1. Klick auf **Sim**. Zuerst leuchtet ein paar Sekunden lang Grün, während sich der Kondensator füllt, dann Rot.
2. Drück kurz den Taster. Grün, und nach etwa vier Sekunden wieder Rot.
3. Halte den Taster eine Weile. Es bleibt grün, und die vier Sekunden beginnen erst, wenn du loslässt.

## Was passiert hier
Der Taster leert den Kondensator. Solange die Kondensatorspannung niedrig ist, bekommt der erste Transistor keinen Basisstrom und ist aus. Dadurch kann der zweite leiten: Grün. Nach dem Loslassen lädt sich der Kondensator langsam über 100 kΩ auf. Übersteigt er etwa 3 V, schaltet der erste Transistor ein und der zweite aus: Rot. Die beiden Transistoren teilen sich einen Emitterwiderstand. Dadurch schnappt der Wechsel um, statt langsam zu verblassen. Größerer Kondensator oder größerer Widerstand: längeres Grün.

## Weiter geht's
- [lab-two-led-monostable](../lab-two-led-monostable) — dieselbe Aufgabe mit einem Operationsverstärker als Komparator.
- [pc47-555-monostable](../pc47-555-monostable) — und mit dem Timer 555.
