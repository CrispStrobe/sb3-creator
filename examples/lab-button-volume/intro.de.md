---
level: advanced
age: 14+
prereqs: [lab-mosfet-vcr, lab-opamp-integrator]
teaches: [integrator, voltage-controlled-resistor, volume-control, analog-memory]
---
## Was du siehst
Ein Operationsverstärker spielt einen Ton in einen Ohrhörer. Dazwischen leitet ein MOSFET den Ton zu seiner Source ab, und ein zweiter Operationsverstärker mit Kondensator hält die Spannung am Gate des MOSFETs fest. Zwei Taster: leiser und lauter.

## Probier das
1. Klick auf **Sim** und hör hin: Der Ton ist kaum zu hören.
2. Halte **lauter** einen Moment gedrückt. Der Ton wird voll laut.
3. Tippe ein paarmal auf **leiser**. Jeder Tipp dreht ihn eine Stufe herunter, und zwischen den Tipps bleibt er, wo er ist.
4. Leg eine Oszilloskop-Sonde an den Ausgang des Operationsverstärkers (das erste Gate des MOSFETs) und sieh zu, wie er stufenweise wandert.

## Was passiert hier
Der Operationsverstärker mit dem Kondensator in der Rückkopplung ist ein Integrator. Solange ein Taster gedrückt ist, fließt ein kleiner Strom in seinen invertierenden Eingang hinein oder heraus, und der Operationsverstärker hält diesen Eingang auf halber Betriebsspannung, indem er den Kondensator umlädt: Sein Ausgang wandert gleichmäßig nach oben oder unten. Lässt du los, hört der Strom auf, und der Ausgang bleibt stehen. Der Kondensator ist ein Speicher für eine Spannung. Diese Spannung steuert das Gate des MOSFETs. Liegt das Gate hoch, hat der Kanal nur rund hundert Ohm und schluckt fast den ganzen Ton. Liegt es mehr als etwa 1,2 V unter der Source, ist der Kanal abgeschnürt und der ganze Ton erreicht den Ohrhörer. Dazwischen ist der Kanal ein Widerstand, den die Gatespannung einstellt: Die Taster arbeiten wie ein Lautstärkeknopf ohne bewegliche Teile.

## Weiter geht's
- [lab-mosfet-vcr](../lab-mosfet-vcr) — der Kanal als spannungsgesteuerter Widerstand, nachgemessen.
- [lab-dual-gate](../lab-dual-gate) — was das zweite Gate tut.
