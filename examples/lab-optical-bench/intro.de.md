# Optische Bank: das Abstandsquadratgesetz

Eine LED und ein Lichtsensor stehen sich auf einer Bank gegenüber. Schieb den Sensor weiter weg und sieh zu, wie die Anzeige fällt, nicht geradlinig, sondern mit dem Quadrat des Abstands.

**Vermittelt:** Abstandsquadratgesetz, Abstrahlwinkel einer LED, die Fotodiode als lineares Lichtmessgerät

## Was zu tun ist

Klick auf **Sim** und merk dir die Anzeige bei 10 cm. Dreh den Knopf des Lichtwegs auf 5 cm, dann auf 20 cm. Setz im Inspektor `angleDeg` des Lichtwegs auf 15 und dann auf 30.

## Was du sehen solltest

- 10 cm: etwa 0,124 V.
- 5 cm: viermal so viel. 20 cm: ein Viertel.
- 15° neben der Achse: die halbe Anzeige.

## Warum es funktioniert

Das Licht der LED breitet sich als Kegel aus. Im doppelten Abstand bedeckt es die vierfache Fläche, also bekommt jeder Quadratzentimeter ein Viertel des Lichts. Der Strom der Fotodiode ist proportional zum Licht, das auf sie fällt, und damit auch die Spannung an ihrem Widerstand.
