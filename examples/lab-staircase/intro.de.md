---
level: advanced
age: 14+
prereqs: [lab-opamp-blinker, lab-opamp-integrator]
teaches: [charge-pump, integrator, counting, staircase, analog-to-digital]
---
## Was du siehst
Ein Zeiger, der in gleichen Sprüngen klettert, ein Sprung pro Blinken einer roten LED. Nach dreizehn Sprüngen ist er oben; drück RESET, und er fällt auf null zurück und klettert von vorn.

## Probier das
1. Starte die Simulation und zähle mit: Blinken, Sprung, Blinken, Sprung. Jeder Sprung ist etwa 0,56 V groß.
2. Häng das Oszilloskop an den Ausgang des Integrators: Du siehst eine Treppe, flach zwischen den Stufen.
3. Drück jederzeit RESET. Die Treppe beginnt wieder bei 0 V.
4. Berechne die Stufenhöhe aus C_pump, C_int und dem Hub des Taktes, bevor du misst.

## Was dahintersteckt
Jedes Mal, wenn der Takt fällt, drückt der kleine 100-nF-Kondensator den Pumpknoten ins Negative. Eine Diode lässt ihn eine feste Ladungsmenge aus dem Integrator ziehen, und der Integrator hebt seinen Ausgang um diese Ladung geteilt durch seinen 1-µF-Kondensator an. Steigt der Takt, füllt die andere Diode den kleinen Kondensator von Masse aus wieder auf. So wandert in jedem Takt dasselbe Ladungspaket, und der Ausgang zählt die Pakete zusammen. Vergleicht man die Treppe mit einer Schwelle, erhält man einen einfachen Analog-Digital-Wandler oder einen Zeitgeber; lässt man die Stufen langsam abfließen, einen Messer für die Pulsrate.

## Weiter geht's
- [lab-opamp-blinker](../lab-opamp-blinker): der Takt für sich.
- [lab-opamp-integrator](../lab-opamp-integrator): ein Integrator mit gleichmäßigem Strom.
