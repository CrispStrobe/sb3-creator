---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower, pc39-nmos-switch]
teaches: [mosfet, depletion-mode, voltage-controlled-resistor, pinch-off]
---
## Was du siehst
Ein MOSFET mit zwei Gates, darüber ein Widerstand von 4,7 kΩ, unter seiner Source eine rote LED und am ersten Gate ein Drehknopf. Das Voltmeter zeigt, wie viel von der Batteriespannung am Kanal des Transistors liegt.

## Probier das
1. Klick auf **Sim**. Steht der Knopf in der Mitte, zeigt das Messgerät einige Volt.
2. Dreh den Knopf langsam nach unten. Die Anzeige steigt und bleibt am Höchstwert stehen: Der Kanal leitet gar nicht mehr.
3. Dreh ihn ganz nach oben. Die Anzeige fällt fast auf null: Jetzt hat der Kanal nur noch rund hundert Ohm.
4. Drück den Taster. Er verbindet Gate und Source, die Gatespannung ist also null. Leitet der Transistor?

## Was passiert hier
Zwischen Source und Drain liegt ein dünner leitender Kanal. Darüber sitzt, durch eine Oxidschicht isoliert, das Gate. Seine Spannung drängt die Ladungsträger aus dem Kanal heraus oder zieht sie hinein. Bei diesem MOSFET ist der Kanal schon bei null Volt am Gate vorhanden: Es ist ein Verarmungs-MOSFET (selbstleitend). Abschnüren lässt er sich erst, wenn das Gate mehr als etwa 1,2 V unter der Source liegt. Die rote LED hebt die Source etwas über Masse an, so dass der Knopf mit nur einer Batterie diese negativen Gatespannungen erreicht. Dazwischen verhält sich der Kanal einfach wie ein Widerstand, dessen Wert du mit einer Spannung einstellst.

## Weiter geht's
- [lab-dual-gate](../lab-dual-gate) — auch das zweite Gate kann den Kanal abschnüren.
- [lab-button-volume](../lab-button-volume) — der spannungsgesteuerte Widerstand als Lautstärkeregler.
