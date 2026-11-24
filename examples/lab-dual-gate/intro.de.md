---
level: advanced
age: 14+
prereqs: [lab-mosfet-vcr]
teaches: [dual-gate-mosfet, pinch-off, and-gate]
---
## Was du siehst
Ein MOSFET mit zwei Gates. Jedes Gate hat seinen eigenen Schiebeschalter, in der Drainleitung sitzt eine grüne LED. Eine rote LED unter der Source hebt diese etwas über Masse an.

## Probier das
1. Klick auf **Sim**: Beide Schalter stehen links, beide Gates liegen hoch, die grüne LED leuchtet.
2. Schieb den ersten Schalter nach rechts. Die LED geht aus.
3. Schieb ihn zurück und versuch es stattdessen mit dem zweiten Schalter. Das Ergebnis ist dasselbe.
4. Bei welchen Schalterstellungen leuchtet die LED? Schreib es als Tabelle auf: Du hast ein UND-Gatter gebaut.

## Was passiert hier
Die beiden Gates liegen hintereinander über demselben Kanal, Gate 1 am Source-Ende, Gate 2 am Drain-Ende. Die Elektronen müssen auf ihrem Weg unter beiden hindurch. Jedes Gate kann die Ladungsträger aus seinem Teil des Kanals verdrängen, und dann ist der ganze Kanal gesperrt, so wie ein Schlauch, den man an irgendeiner Stelle abklemmt. Weil die rote LED die Source anhebt, liegt ein Gate, das du auf Masse schaltest, etwa 1,8 V unter der Source, und das reicht, um diesen selbstleitenden Transistor abzuschnüren. In Radios regelt man mit dem zweiten Gate eines solchen MOSFETs die Verstärkung einer Stufe.

## Weiter geht's
- [lab-mosfet-vcr](../lab-mosfet-vcr) — zwischen ein und aus: der Kanal als Widerstand.
- [lab-humidity-comb](../lab-humidity-comb) — ein Gate, das vom Atem gesteuert wird.
