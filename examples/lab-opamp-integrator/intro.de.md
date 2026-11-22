---
level: advanced
age: 14+
prereqs: [lab-opamp-gain, pc06-rc-charge]
teaches: [integrator, op-amp, virtual-ground, constant-current, ramp]
---
## Was du siehst
Ein Operationsverstärker mit einem Kondensator in der Rückkopplung, ein RUN-Schalter und ein Zeigerinstrument. Schließ RUN, und der Zeiger wandert gleichmäßig nach oben, fast genau 0,9 V pro Sekunde, wie der Zeiger einer Stoppuhr. Öffne RUN, und er bleibt stehen; drück RESET, und er geht auf null zurück.

## Probier das
1. Schließ RUN und halte die Luft an. Öffne RUN, wenn du atmen musst, und lies ab: Teile durch 0,9, dann hast du deine Zeit in Sekunden.
2. Vergleiche den Anstieg mit einer gewöhnlichen RC-Ladung: Hier bleibt die Linie bis ganz oben gerade.
3. Sag voraus, wie schnell der Zeiger mit R_in = 200 kΩ oder C = 47 µF liefe.

## Was dahintersteckt
Der Operationsverstärker hält seinen invertierenden Eingang auf 0 V. Bei geschlossenem RUN fließt ein fester Strom von 9 V / 100 kΩ = 90 µA durch R_in ab, und er kann nur aus dem Kondensator kommen. Ein Kondensator, der mit konstantem Strom geladen wird, gewinnt jede Sekunde dieselbe Spannung: I / C = 0,9 V/s. Eine gewöhnliche RC-Schaltung wird langsamer, weil ihr Ladestrom abnimmt, je voller der Kondensator wird; hier hält der Operationsverstärker den Strom konstant, und die Rampe bleibt gerade. Solche Integratoren stecken in Rampengeneratoren, Analog-Digital-Wandlern und jedem Analogrechner.

## Weiter geht's
- [lab-staircase](../lab-staircase): derselbe Integrator, gefüttert mit Ladungspaketen.
- [lab-opamp-gain](../lab-opamp-gain): OPV-Rückkopplung nur mit Widerständen.
