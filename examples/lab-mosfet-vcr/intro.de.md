---
level: advanced
age: 14+
prereqs: [lab-mosfet-current-source]
teaches: [mosfet, depletion-mode, pinch-off, voltage-controlled-resistor]
---
## Was du siehst
Ein MOSFET mit einer grünen LED in der Drainleitung und einer roten LED unter seiner Source. Ein Drehknopf stellt die Spannung seines ersten Gates ein, und ein Voltmeter zeigt diese Gatespannung, gemessen gegen die Source.

## Probier das
1. Klick auf **Sim** und lies das Messgerät ab: Das Gate ist etwas negativ, und die grüne LED leuchtet schon.
2. Dreh den Knopf ganz herunter. Das Gate wird immer negativer, und die LED erlischt allmählich.
3. Dreh ihn langsam wieder hoch und beobachte das Messgerät: Bei welcher Gatespannung beginnt die LED zu glimmen? Ab wann ist sie voll hell?
4. Drück den Taster. Er verbindet Gate und Source, die Gatespannung ist also null. Leuchtet die LED?

## Was passiert hier
Zwischen Source und Drain liegt ein dünner leitender Kanal, darüber, durch eine Oxidschicht isoliert, das Gate. Ein negatives Gate verdrängt die Ladungsträger aus dem Kanal und macht ihn enger; bei etwa −1,2 V ist er ganz abgeschnürt. Bei einem selbstleitenden MOSFET ist der Kanal schon bei null Volt am Gate offen, und ein positives Gate öffnet ihn noch weiter. Damit mit nur einer Batterie negative Gatespannungen möglich sind, hebt die rote LED die Source etwas über Masse: Ein Gate auf 0 V liegt dann unter der Source. Dazwischen verhält sich der Kanal wie ein Widerstand, dessen Wert eine Spannung einstellt.

## Weiter geht's
- [lab-dual-gate](../lab-dual-gate) — auch das zweite Gate kann den Kanal abschnüren.
- [lab-button-volume](../lab-button-volume) — der spannungsgesteuerte Kanal als Lautstärkeregler.
