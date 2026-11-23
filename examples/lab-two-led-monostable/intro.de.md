---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc40-opamp-threshold]
teaches: [monostable, comparator, rc-time-constant]
---
## Was du siehst
Eine rote und eine grüne LED wie an einer Fußgängerampel. Rot ist der Ruhezustand. Drück den Taster, dann wird es grün — etwa elf Sekunden lang — und danach von selbst wieder rot.

## Probier das
1. Klick auf **Sim**. Rot leuchtet.
2. Drück kurz den Taster und zähl mit.
3. Halte den Taster ein paar Sekunden gedrückt. Wann beginnt das Zählen wirklich?
4. Stell dir einen doppelt so großen Kondensator vor. Wie lange bliebe es grün?

## Was passiert hier
Der Taster füllt den Kondensator augenblicklich auf 9 V. Der Operationsverstärker vergleicht die Kondensatorspannung mit festen 3 V: darüber ist der Ausgang hoch und Grün leuchtet, darunter ist er tief und Rot leuchtet über die andere LED. Der Kondensator entlädt sich langsam über den 470-kΩ-Widerstand, und die Zeit bis zur 3-V-Grenze bestimmt, wie lange Grün bleibt. Größerer Widerstand oder größerer Kondensator: länger Grün.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable) — dieselbe Aufgabe mit einem 555.
- [lab-delay-off-timer](../lab-delay-off-timer) — ein Zeitgeber ohne Komparator, der langsam ausgeht.
