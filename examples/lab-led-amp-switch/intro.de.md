# Eine LED schaltet ein Licht: Sensor-LED am Verstärkerchip

Eine LED funktioniert auch rückwärts: fällt Licht auf sie, treibt sie einen winzigen Strom heraus. Hier ist eine gewöhnliche rote LED der Lichtsensor. Ein LM386-Verstärkerchip macht aus ihrem Bruchteil eines Volts einige Volt, und ein Transistor schaltet damit eine Lampe ein.

**Vermittelt:** LED als Fotodiode, Gleichspannungsverstärkung mit einem Leistungsverstärkerchip, eine eingestellte Spannung als Schaltschwelle, Transistorschalter

## Was zu tun ist

Klick auf **Sim** und warte einen Moment, bis sich der Verstärker eingeschwungen hat. Beobachte das Voltmeter (voltmeter_8) am Verstärkerausgang. Schieb jetzt das Licht auf der Sensor-LED (led_3) langsam von dunkel bis ganz hell. Stell das Licht dann auf die Mitte und dreh LEVEL (potentiometer_6) herunter und wieder hinauf.

## Was du sehen solltest

- Im Dunkeln ruht der Ausgang bei 0,9 V, und die gelbe Lampe (led_13) ist aus.
- Mit mehr Licht steigt der Ausgang: 1 V mehr für jede 0,05 V, die die Sensor-LED liefert. Bei etwa einem Drittel des vollen Lichts beginnt die Lampe zu glimmen; bei 0.7 leuchtet sie voll.
- Bei halbem Licht: dreh LEVEL herunter, und die Lampe leuchtet voll; dreh ihn hinauf, und die Lampe geht aus.

## Warum es funktioniert

Im Chip hat jeder Eingang 50 kΩ nach Masse, so werden die wenigen Mikroampere der LED zu einem Bruchteil eines Volts am +-Eingang. Der Chip verstärkt den Unterschied zwischen seinen beiden Eingängen 20-fach, und sein Ausgang ruht bei halber Versorgungsspannung, wenn beide gleich sind. LEVEL legt eine kleine Spannung an den −-Eingang: solange das Licht sie nicht übertrifft, bleibt der Ausgang unten. Darüber steigt der Ausgang, und sobald er etwa 1,3 V überschreitet, beginnt der Transistor zu leiten, und die Lampe leuchtet.
