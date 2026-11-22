# Drehspul-Voltmeter: Vorwiderstände und Belastung

In einem Zeigerinstrument steckt eine Spule, die einen Zeiger bewegt. Diese hier schlägt schon bei 100 µA voll aus und hat 1 kΩ Widerstand. Mit einem Vorwiderstand wird daraus ein Voltmeter für jeden gewünschten Messbereich. Miss damit einen einfachen Spannungsteiler und beobachte, wie das Messgerät die Spannung verändert, die es messen soll.

**Vermittelt:** das ohmsche Gesetz im Messgerät, Vorwiderstände, Belastung durch das Messgerät

## Was zu tun ist

Klick auf **Sim** und lies den Zeiger im 5-V-Bereich ab. Vergleiche mit dem Referenz-Voltmeter: Beide zeigen etwa 4,09 V, nicht die 4,5 V, die man für zwei gleiche Widerstände ausrechnet. Stell den Bereichsschalter auf 10 V. Die Anzeige steigt auf etwa 4,28 V, näher an der Wahrheit, aber der Zeiger schlägt nur noch halb so weit aus.

## Was du sehen solltest

- 5-V-Bereich: 4,09 V, Zeiger bei etwa 82 % des Vollausschlags.
- 10-V-Bereich: 4,28 V, Zeiger bei etwa 43 %.
- Auch das Referenz-Voltmeter ändert sich: Das Messgerät zieht den Teiler wirklich herunter.

## Warum es funktioniert

Vollausschlag braucht 100 µA. Im 5-V-Bereich hat das Messgerät insgesamt 50 kΩ, also treiben 5 V genau 100 µA hindurch. Diese 50 kΩ liegen aber auch parallel zu den unteren 10 kΩ des Teilers und senken dort die Spannung. Ein gutes Voltmeter hat einen viel höheren Widerstand als die Schaltung, die es misst.
