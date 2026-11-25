# Messverstärker: Nullabgleich und Verpolschutz

Zwei Messverstärker und was sie in der Praxis brauchen. Eine ×10-Stufe an einem hochohmigen Eingang zeigt etwas an, obwohl nichts angeschlossen ist, und ein Poti gleicht das ab. Ein Strommessverstärker bekommt eine Diode, die seinen Eingang schützt, wenn die Messschaltung verkehrt herum angeschlossen wird.

**Vermittelt:** Eingangsruhestrom, Nullabgleich, Eingangsschutz

## Was zu tun ist

Klick auf **Sim**. Lies das ×10-Messgerät (voltmeter_16) ab, ohne dass etwas angeschlossen ist, und dreh dann ZERO (potentiometer_9), bis es null zeigt. Drück PROBE (button_11). Dann lies das Strommessgerät (voltmeter_26) ab und schieb POLARITY (slide_switch_19) nach rechts.

## Was du sehen solltest

- ×10-Messgerät: etwa 0,41 V ohne Anschluss; null nach dem Abgleich; etwa 0,49 V mit PROBE.
- Strommessgerät: etwa 3,9 V (79 mA); mit vertauschter Polarität zeigt es einfach null.

## Warum es funktioniert

Die Eingangstransistoren des Operationsverstärkers brauchen einen winzigen Strom, etwa 45 nA; durch den 1-MΩ-Eingangswiderstand ergibt das 41 mV, und die Stufe verstärkt sie zehnfach. Das ZERO-Poti schickt einen gleich großen Strom in die Gegenrichtung. Beim Strommesser leitet die Germaniumdiode, sobald der Eingang ein Fünftel Volt unter Masse geht, und die 10 kΩ begrenzen ihren Strom.
