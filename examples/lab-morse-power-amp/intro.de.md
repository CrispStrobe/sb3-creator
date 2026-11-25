# Morsesummer mit einem Leistungsverstärker

Zwei Transistoren erzeugen einen Ton, und ein LM386-Leistungsverstärker treibt damit den Lautsprecher. Eine Morsetaste schaltet den Oszillator ein und aus. Ein Spannungsteiler dazwischen bestimmt, wie viel Signal den Verstärker erreicht, und ein Widerstand an den Verstärkungsanschlüssen, wie stark er verstärkt. Bekommt er zu viel Signal, wird er übersteuert: Der Ton wird rau statt lauter.

**Vermittelt:** Transistor-Multivibrator als Tonquelle, Abschwächer, Verstärkung, Übersteuerung

## Was zu tun ist

Klick auf **Sim** und drück den Taster (die Morsetaste) kurz und lang. Probier dann die beiden Schiebeschalter: den Abschwächer (stark oder schwach) und den Verstärkungswiderstand.

## Was du sehen solltest

- Taste oben: Stille. Taste gedrückt: ein Ton von etwa 780 Hz.
- Starke Abschwächung: ein leiser, sauberer Ton. Mit dem Verstärkungswiderstand: etwa dreimal lauter.
- Schwache Abschwächung: Der Verstärkerausgang stößt bei 0,9 V und etwa 8,1 V an seine Grenzen: Der Ton ist verzerrt, und mehr Verstärkung hilft nicht.

## Warum es funktioniert

Die Transistoren schalten abwechselnd ein, das ergibt an ihren Kollektoren einen Rechteckton. Der Teiler gibt nur einen kleinen Teil davon an den Verstärker weiter, der ihn mit 20 multipliziert, oder mit mehr, wenn Widerstand und Kondensator an den Verstärkungsanschlüssen liegen. Ein Verstärker kann seinen Ausgang nicht über seine Versorgung hinaus aussteuern: Ein Signal, das mehr bräuchte, wird flach abgeschnitten, und so klingt Übersteuerung.
