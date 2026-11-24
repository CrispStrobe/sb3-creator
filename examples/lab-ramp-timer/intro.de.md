---
level: advanced
age: 14+
prereqs: [lab-tilt-table]
teaches: [integrator, ramp, timer, threshold-detector]
---
## Was du siehst
Ein Integrator mit Operationsverstärker, dazu ein Schalter Halt/Lauf, ein Zeit-Drehknopf und ein Taster **Null**, außerdem drei Transistorstufen mit grüner, gelber und roter LED.

## Probier das
1. Klick auf **Sim**. Der Zeitgeber läuft schon: Grün, dann Gelb, dann Rot gehen in gleichen Abständen an, jeweils knapp eine halbe Sekunde auseinander.
2. Drück **Null**: Alles ist wieder dunkel, und die Zeit läuft von vorn.
3. Schalt mittendrin auf Halt: Alles bleibt stehen. Schalt zurück, und es geht weiter.
4. Dreh den Zeitknopf in Richtung langsam und drück **Null**: Jetzt dauert es mehrere Sekunden.

## Was passiert hier
Auf Lauf liegt der Eingangswiderstand zwischen Masse und dem Minus-Eingang, den der Operationsverstärker auf etwa 1 V hält. Also fließt ein gleichbleibender Strom, etwa 1 V geteilt durch den Widerstand, und er geht ganz in den Kondensator. Ein Kondensator, der mit konstantem Strom geladen wird, lädt sich geradlinig auf: Der Ausgang steigt wie der Zeiger einer Uhr. Jede Transistorstufe schaltet ein, wenn die Rampe ihre Spannung erreicht, und auf einer geraden Rampe sind gleiche Spannungsschritte gleiche Zeitschritte. Auf Halt liegen beide Enden des Eingangswiderstands auf denselben 1 V: kein Strom, die Rampe steht.

## Weiter geht's
- [lab-tilt-table](../lab-tilt-table) — derselbe Integrator, mit einem Drehknopf als Eingang.
- [lab-delay-off-timer](../lab-delay-off-timer) — ein Zeitgeber mit einem Kondensator, der sich entlädt, nicht geradlinig.
