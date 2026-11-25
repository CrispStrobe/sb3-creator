# Ein Silizium-PTC-Fühler in einer Brücke: Messgerät und Warm/Kalt-LEDs

Ein Silizium-PTC-Fühler ändert seinen Widerstand um weniger als ein Prozent pro Grad. In einer Brücke wird aus dieser kleinen Änderung eine deutliche Anzeige: ein Messgerät, das nach beiden Seiten von null ausschlägt, und zwei LEDs, die warm oder kalt melden.

**Vermittelt:** die Wheatstone-Brücke, Silizium-PTC-Fühler, ein Komparator

## Was zu tun ist

Klick auf **Sim**. Nimm in der Instrumentenspalte den Regler **Temperatur** des Fühlers oder seine Knöpfe (Eis, Raum, Finger, heißes Wasser). Beobachte das Messgerät und die beiden LEDs. Das Abgleich-Potentiometer legt fest, welche Temperatur als Null gilt.

## Was du sehen solltest

- Raumtemperatur (25 °C): Das Messgerät bleibt auf 0.
- Kälter: Der Zeiger schlägt nach links aus (−22 mV bei 15 °C), die grüne LED leuchtet.
- Wärmer: Der Zeiger schlägt nach rechts aus (+23 mV bei 35 °C), die rote LED leuchtet.

## Warum es funktioniert

Jeder Zweig der Brücke ist ein Spannungsteiler. Teilen beide Zweige im gleichen Verhältnis, liegen die Punkte A und B auf gleicher Spannung, und durch das Messgerät fließt kein Strom. Erwärmt sich der Fühler, steigt sein Widerstand, A steigt über B, und das Messgerät zeigt den Unterschied. Der Verstärker multipliziert diesen Unterschied mit 200, das reicht, um mit wenigen Millivolt eine LED zu schalten.
