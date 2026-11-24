---
level: advanced
age: 14+
prereqs: [lab-mosfet-vcr]
teaches: [dual-gate-mosfet, pinch-off]
---
## Was du siehst
Ein MOSFET mit zwei Gates. Jedes Gate hat seinen eigenen Drehknopf und seinen eigenen Taster, in der Drainleitung sitzt eine grüne LED. Eine rote LED unter der Source hebt diese etwas über Masse an.

## Probier das
1. Klick auf **Sim**: Beide Knöpfe stehen oben, die grüne LED leuchtet.
2. Dreh den ersten Knopf langsam herunter, bis die LED ausgeht. Probier jetzt den zweiten Knopf: Ändert er etwas?
3. Dreh den ersten Knopf wieder hoch und dann den zweiten herunter. Welcher Knopf dimmt die LED früher?
4. Drück einen der Taster: Er zieht sein Gate auf Masse, unter die Source.

## Was passiert hier
Die beiden Gates liegen hintereinander über demselben Kanal, Gate 1 am Source-Ende, Gate 2 am Drain-Ende. Die Elektronen müssen auf ihrem Weg unter beiden hindurch. Jedes Gate kann die Ladungsträger aus seinem Teil des Kanals verdrängen, und dann ist der ganze Kanal gesperrt, so wie ein Schlauch, den man an irgendeiner Stelle abklemmt. Hat ein Gate ihn geschlossen, hat das andere nichts mehr zu steuern. In Radios regelt man mit dem zweiten Gate eines solchen Transistors die Verstärkung einer Stufe.

## Weiter geht's
- [lab-mosfet-nand](../lab-mosfet-nand) — ein Dual-Gate-MOSFET als Logikgatter.
- [lab-humidity-comb](../lab-humidity-comb) — ein Gate, das vom Atem gesteuert wird.
