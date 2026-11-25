# Die Schwebung als Stroboskop: ein Mischer gegen das Netz

Zwei Transistoren nehmen das 50-Hz-Brummen eines Netzkabels auf und machen daraus Rechteckimpulse. Ein Verstärker-Chip blinkt mit einem Takt, den du in der Nähe von 50 Hz einstellen kannst. Beides geht in einen Mischer-Chip, der die beiden multipliziert. Nach dem Glätten bleibt ihre *Differenz* übrig: Läuft der Blinker mit 44 Hz, schwingt der Ausgang des Mischers sechsmal pro Sekunde, und ein Voltmeter zwischen seinen Ausgängen pendelt mit.

**Vermittelt:** Differenzfrequenz, Schwebung, stroboskopische Verlangsamung

## Was zu tun ist

Klick auf **Sim** und beobachte das Voltmeter zwischen den Ausgängen des Mischers. Dreh dann den Knopf **RATE** langsam auf.

## Was du sehen solltest

- Bei RATE 0 pendelt die Anzeige mehrmals pro Sekunde von Minus nach Plus.
- Beim Aufdrehen wird das Pendeln langsamer, bis es fast stehen bleibt (Schwebungsnull), danach wird es wieder schneller.

## Warum es funktioniert

Zwei Rechtecke multipliziert ergeben einen hohen Wert, wo sie übereinstimmen, und einen niedrigen, wo nicht. Sind ihre Frequenzen etwas verschieden, laufen sie langsam in Takt und wieder heraus, und das geglättete Produkt steigt und fällt mit der Differenzfrequenz. Ein Stroboskop arbeitet genauso: Eine Lampe, die fast so schnell blitzt, wie sich ein Rad dreht, zeigt das Rad langsam drehend.
