---
level: intermediate
age: 12+
prereqs: [pc45-nand-test]
teaches: [NAND-gate, inverter, NOT-gate, logic]
---
## Was du siehst
Ein NAND-Gatter, dessen Eingänge zusammengeschlossen sind, wird zum Negator (Inverter): Schalter EIN → LED AUS. Schalter AUS → LED EIN. Ein einziges Gatter erzeugt die NOT-Funktion.

## Probier das
1. Klick auf **Sim** — die LED leuchtet (Eingang Low → Ausgang High).
2. Schalte den Schalter ein — die LED erlischt (Eingang High → Ausgang Low).
3. Zurückschalten — die LED leuchtet wieder.

## Was passiert hier
Ein NAND-Gatter mit beiden Eingängen am selben Signal gibt nur dann Low aus, wenn beide Eingänge High sind — was dasselbe ist wie NOT. Das ist die Grundlage aller NAND-Logik: jedes andere Gatter (AND, OR, NOR, XOR) lässt sich aus NAND-Gattern aufbauen.

## Weiter geht's
- [pc45-nand-test](../pc45-nand-test) — die vollständige NAND-Wahrheitstabelle.
- [pc71-nand-entpreller](../pc71-nand-entpreller) — zwei NAND-Gatter als SR-Latch.
