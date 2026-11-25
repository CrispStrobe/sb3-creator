# Dreieck, Sägezahn und eine Diode

Ein Integrator und ein Schmitt-Trigger aus Operationsverstärkern jagen einander: ein Dreieck und ein Rechteck. Eine Diode lässt den Integrator viel schneller zurücklaufen, und aus dem Dreieck wird ein Sägezahn.

**Vermittelt:** Integrator, Schmitt-Trigger, Kurvenform mit einer Diode

## Was zu tun ist

Klick auf **Sim**. Beobachte die gelbe LED (led_16, das Dreieck) und die rote LED (led_14, das Rechteck). Schließ SHAPE (switch_7) und schau noch einmal; wenn du magst, miss den Integratorausgang mit dem Oszilloskop.

## Was du sehen solltest

- SHAPE offen: ein Dreieck mit etwa 23 Hz zwischen 3,3 V und 6,5 V; die rote LED flackert.
- SHAPE geschlossen: die Rampe springt in unter einer Millisekunde zurück und steigt langsam an: ein Sägezahn. Das Rechteck wird zu kurzen Pulsen.

## Warum es funktioniert

Der Integratorausgang bewegt sich so schnell, wie der Strom in seinen Kondensator es erlaubt. Die Diode schaltet nur für eine Stromrichtung einen zweiten, viel kleineren Widerstand dazu; eine Flanke wird steil, die andere bleibt wie sie war.
