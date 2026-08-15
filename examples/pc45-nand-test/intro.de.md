---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [nand-gate, truth-table, digital-logic]
---
## Was du siehst
Ein NAND-Gatter mit zwei Schaltern als Eingänge und einer LED als Ausgangsanzeige. Die LED zeigt das Ergebnis der NAND-Verknüpfung: Sie ist nur aus, wenn beide Eingänge auf High liegen.

## Probier das
1. Klick auf **Sim** mit beiden Schaltern offen (beide Eingänge auf Low). Die LED leuchtet — NAND von (0,0) ist 1.
2. Schließe einen Schalter. Die LED leuchtet weiter — NAND von (0,1) oder (1,0) ist immer noch 1.
3. Schließe beide Schalter. Die LED erlischt — NAND von (1,1) ist 0. Das ist die einzige Kombination, die sie ausschaltet.

## Was passiert hier
Ein NAND-Gatter gibt nur dann Low aus, wenn alle Eingänge auf High liegen; ansonsten gibt es High aus. Es ist die invertierte UND-Funktion. Die Wahrheitstabelle hat vier Zeilen, und drei davon erzeugen einen High-Ausgang. Die Pull-down-Widerstände stellen sicher, dass jeder Eingang bei offenem Schalter auf einem definierten Low-Pegel liegt — ohne sie könnte ein schwebender Eingang als High oder Low gelesen werden.

## Warum das wichtig ist
NAND ist das universelle Gatter — jede andere Logikfunktion (AND, OR, NOT, XOR) kann allein aus NAND-Gattern aufgebaut werden. Jede digitale Schaltung, vom einfachsten Zähler bis zum komplexesten Prozessor, ist letztlich aus Kombinationen von NAND- (oder NOR-) Gattern aufgebaut.

## Weiter geht's
- [pc46-xor-selector](../pc46-xor-selector) — das XOR-Gatter: andere Logik, gleiche Schalter.
- [pc28-logic-interlock](../pc28-logic-interlock) — Logikgatter steuern echte Lasten.
- Experiment: Baue ein NOT-Gatter aus einem einzelnen NAND, indem du beide Eingänge zusammenschaltest.
