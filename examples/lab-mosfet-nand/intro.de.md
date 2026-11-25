---
level: intermediate
age: 12+
prereqs: [lab-dual-gate]
teaches: [nand-gate, dual-gate-mosfet, logic]
---
## Was du siehst
Ein MOSFET mit zwei Gates, zwei Taster und eine rote LED, die quer über dem Transistor liegt. Eine gelbe LED unter der Source leuchtet die ganze Zeit.

## Probier das
1. Klick auf **Sim**: Die rote LED leuchtet.
2. Drück Taster A. Leuchtet sie noch? Lass los und drück Taster B.
3. Drück beide Taster zugleich. Was passiert?
4. Schreib die vier Fälle in eine Tabelle. Welches Logikgatter ist das?

## Was passiert hier
Jeder Taster hebt ein Gate an; losgelassen liegt das Gate unter der Source und schnürt den Kanal ab. Der Kanal leitet nur, wenn beide Gates oben sind. Die rote LED liegt quer über dem Kanal: Solange er gesperrt ist, muss der Strom aus dem 1-kΩ-Widerstand durch die LED. Leitet der Kanal, übernimmt er diesen Strom selbst, und die LED geht aus. Die LED ist also nur dann aus, wenn A und B gedrückt sind: ein NAND-Gatter, der Baustein, aus dem sich jedes andere Logikgatter bauen lässt, hier aus einem einzigen Transistor.

## Weiter geht's
- [lab-dual-gate](../lab-dual-gate) — die beiden Gates mit Drehknöpfen.
- [pc93-nand-is-universal](../pc93-nand-is-universal) — warum NAND jedes andere Gatter bauen kann.
