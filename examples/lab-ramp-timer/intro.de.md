---
level: advanced
age: 14+
prereqs: [lab-tilt-comparator]
teaches: [integrator, ramp, timer, threshold-detector]
---
## Was du siehst
Ein Integrator mit Operationsverstärker, dazu ein Schalter Halt/Lauf, ein Zeit-Drehknopf und ein Taster **Null**, außerdem drei weitere Verstärker als Komparatoren mit grüner, gelber und roter LED.

## Probier das
1. Klick auf **Sim**. Der Zeitgeber läuft schon: Grün, dann Gelb, dann Rot gehen in gleichen Abständen an, jeweils knapp eine halbe Sekunde auseinander.
2. Drück **Null**: Alles ist wieder dunkel, und die Zeit läuft von vorn.
3. Schalt mittendrin auf Halt: Alles bleibt stehen. Schalt zurück, und es geht weiter.
4. Dreh den Zeitknopf in Richtung langsam und drück **Null**: Jetzt dauert es mehrere Sekunden.

## Was passiert hier
Auf Lauf liegt der Eingangswiderstand zwischen Masse und dem Minus-Eingang, den der Operationsverstärker auf etwa 1 V hält. Also fließt ein gleichbleibender Strom, etwa 1 V geteilt durch den Widerstand, und er geht ganz in den Kondensator. Ein Kondensator, der mit konstantem Strom geladen wird, lädt sich geradlinig auf: Der Ausgang steigt wie der Zeiger einer Uhr. Jeder Komparator schaltet seine LED ein, sobald die Rampe seinen Abgriff der Widerstandskette überholt, und auf einer geraden Rampe sind gleiche Spannungsschritte gleiche Zeitschritte. Auf Halt liegen beide Enden des Eingangswiderstands auf denselben 1 V: kein Strom, die Rampe steht.

## Weiter geht's
- [lab-tilt-comparator](../lab-tilt-comparator) — ein einzelner Operationsverstärker als Komparator.
- [lab-delay-off-timer](../lab-delay-off-timer) — ein Zeitgeber mit einem Kondensator, der sich entlädt, nicht geradlinig.
