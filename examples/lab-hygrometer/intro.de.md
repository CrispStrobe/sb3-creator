---
level: advanced
age: 14+
prereqs: [lab-humidity-comb, lab-opamp-gain]
teaches: [humidity-sensor, inverting-amplifier, transimpedance, meter]
---
## Was du siehst
Der Feuchtekamm mit Salzfilm speist eine Operationsverstärker-Stufe, und ein Drehspulmessgerät zeigt das Ergebnis. Ein Knopf in der Rückkopplung stellt die Verstärkung ein.

## Probier das
1. Klick auf **Sim** und lies das Messgerät in Zimmerluft ab.
2. Schieb die Luftfeuchte in kleinen Schritten hoch. Um wie viel wächst die Anzeige je 5 %?
3. Hauch den Kamm an (**Hauch**): Der Zeiger schlägt an. Dreh die Verstärkung herunter, bis er wieder auf die Skala passt.
4. Dreh die Verstärkung wieder hoch und such die niedrigste Feuchte, die das Messgerät noch deutlich anzeigt.

## Was passiert hier
Der Kamm liegt zwischen Batterie und invertierendem Eingang des Operationsverstärkers. Der Verstärker hält diesen Eingang auf der Referenzspannung, also ist der Strom durch den Kamm einfach 4,5 V geteilt durch seinen Widerstand. Dieser Strom muss ganz durch den Rückkopplungswiderstand, und dadurch sinkt der Ausgang um Strom mal Rückkopplungswiderstand unter die Referenz. Das Messgerät zeigt diesen Abstand. Ein feuchterer Salzfilm leitet besser, es fließt mehr Strom und der Zeiger schlägt weiter aus. Weil sich der Widerstand des Films so steil ändert, entscheidet der Verstärkungsknopf, welcher Feuchtebereich die Skala füllt.

## Weiter geht's
- [lab-humidity-comb](../lab-humidity-comb) — derselbe Kamm schaltet einen MOSFET.
