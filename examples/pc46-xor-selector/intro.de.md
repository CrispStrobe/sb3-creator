---
level: intermediate
age: 12+
prereqs: [pc45-nand-test]
teaches: [xor-gate, difference-detection, parity]
---
## Was du siehst
Ein XOR-Gatter mit zwei Schaltern und einer LED. Die LED leuchtet, wenn genau ein Eingang auf High liegt — sie erkennt „verschieden", nicht „beide" oder „einer von beiden".

## Probier das
1. Klick auf **Sim** mit beiden Schaltern offen. LED dunkel — XOR von (0,0) ist 0.
2. Schließe einen Schalter. LED leuchtet — XOR von (0,1) oder (1,0) ist 1.
3. Schließe beide Schalter. LED erlischt wieder — XOR von (1,1) ist 0.

## Was passiert hier
XOR (exklusives Oder) gibt High aus, wenn die Eingänge verschieden sind, und Low, wenn sie gleich sind. Das macht es zu einem Ein-Bit-Vergleicher: Es beantwortet „sind diese beiden Signale gleich?" Die Pull-down-Widerstände definieren den Low-Zustand jedes Eingangs bei offenem Schalter.

## Warum das wichtig ist
XOR ist der Baustein der Binäraddition (das Summenbit eines Halbaddierers ist ein XOR), der Paritätsprüfung (Erkennung von Übertragungsfehlern) und der Toggle-Logik (einmal drücken zum Einschalten, nochmal zum Ausschalten). Es wird auch in der Verschlüsselung verwendet — XOR mit einem Schlüssel ist die einfachste Chiffre.

## Weiter geht's
- [pc45-nand-test](../pc45-nand-test) — Vergleich mit NAND: gleiche Schalter, andere Logik.
- [pc28-logic-interlock](../pc28-logic-interlock) — Logikgatter in einer Sicherheitsschaltung.
- Experiment: Kann man ein XOR aus drei NAND-Gattern bauen? (Hinweis: Man braucht vier, und es heißt NAND-XOR-Zerlegung.)
