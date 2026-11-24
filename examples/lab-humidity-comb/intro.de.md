---
level: intermediate
age: 12+
prereqs: [lab-mosfet-vcr]
teaches: [humidity-sensor, mosfet, high-impedance-input, sensor-threshold]
---
## Was du siehst
Eine kleine Platine mit zwei Kupferkämmen, deren Zinken ineinandergreifen, überzogen von einem dünnen Salzfilm. Sie verbindet die Batterie mit dem Gate eines MOSFETs. In der Drainleitung wartet eine grüne LED.

## Probier das
1. Klick auf **Sim**. In normaler Zimmerluft bleibt die grüne LED dunkel.
2. Öffne das Stimulus-Feld und schieb die Feuchte langsam hoch. Bei welcher Luftfeuchte beginnt die LED zu glimmen?
3. Drück **Hauch** (etwa 90 %): Die LED leuchtet sofort, als hättest du den Kamm angehaucht.
4. Schieb zurück auf **Trocken** oder **Raum**: Der Kamm trocknet, die LED geht aus.

## Was passiert hier
Trockenes Salz leitet nicht. Ein Salzfilm saugt aber Wasser aus der Luft auf, und die gelösten Salzionen können dann Strom zwischen den Kämmen tragen. Je mehr Wasser, desto mehr Ionen sind beweglich: Der Widerstand sinkt etwa auf ein Zehntel je 12 % Luftfeuchte. In Zimmerluft hat der Kamm rund 10 MΩ, viel mehr als die 100 kΩ nach Masse, also bleibt das Gate nahe 0 V, unterhalb der Source, und der Kanal ist abgeschnürt. Hauchst du ihn an, fällt der Kamm auf wenige Kiloohm: Jetzt gewinnt er das Tauziehen, das Gate steigt und der MOSFET leitet. Ein MOSFET ist hier genau der richtige Verstärker, denn sein Gate nimmt überhaupt keinen Strom auf, so dass sogar ein Sensor mit vielen Megaohm ihn steuern kann.

## Weiter geht's
- [lab-mosfet-vcr](../lab-mosfet-vcr) — wie die Gatespannung den Kanal einstellt.
- [lab-dual-gate](../lab-dual-gate) — das zweite Gate desselben Transistors.
