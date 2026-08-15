---
level: beginner
age: 12+
prereqs: [pc06-rc-charge]
teaches: [series-capacitance, voltage-sharing, equivalent-capacitance]
---
## Was du siehst
Zwei Kondensatoren in Reihe an einer Spannungsquelle. Die Gesamtspannung teilt sich zwischen ihnen auf, und die kombinierte Kapazitaet ist kleiner als jeder einzelne Kondensator.

## Probier das
1. Starte die Simulation und lies die Spannung ueber jedem Kondensator ab — sie addieren sich zur Versorgungsspannung.
2. Verwende gleiche Kondensatoren und pruefe, dass jeder die halbe Versorgungsspannung erhaelt.
3. Probiere ungleiche Werte (z.B. 10 uF und 47 uF) und beobachte, dass der kleinere Kondensator den groesseren Spannungsanteil traegt.

## Was passiert hier
Bei Kondensatoren in Reihe sitzt dieselbe Ladung auf jeder Platte. Ein kleinerer Kondensator braucht mehr Spannung, um diese Ladung zu halten (V = Q/C), und uebernimmt daher einen groesseren Anteil der Gesamtspannung. Die Ersatzkapazitaet ist immer kleiner als der kleinste Einzelkondensator, berechnet als 1/C_gesamt = 1/C1 + 1/C2. Das ist das Gegenteil von Widerstaenden in Reihe, die sich direkt addieren.

## Warum das wichtig ist
Kondensatoren in Reihe erlauben es, einen Kondensator zu bauen, der eine hoehere Spannung aushaelt als jeder einzelne in der Kette. Sie treten auch natuerlich auf, wenn zwei kapazitive Elemente in einem Signalpfad liegen, und das Verstaendnis der Spannungsaufteilung verhindert, dass einer ueberlastet wird.

## Weiter geht's
- [pc06-rc-charge](../pc06-rc-charge) — sieh, wie ein einzelner Kondensator sich ueber einen Widerstand auflaedt.
- [pc50-two-stage-rc](../pc50-two-stage-rc) — Kondensatoren im Kontext eines kaskadierten Filters.
- Experiment: Lege einen grossen Widerstand parallel zu einem Kondensator und beobachte, wie sich die Spannungsbalance mit der Zeit verschiebt, waehrend sich ein Kondensator langsam entlaedt.
