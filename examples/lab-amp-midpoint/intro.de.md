# Endstufe als geteilte Versorgung

Op-Amp-Schaltungen wünschen sich oft eine Plus- und eine Minusversorgung. Eine 9-V-Batterie hat nur eine. Ein Leistungsverstärker mit geerdeten Eingängen sitzt auf halber Versorgungsspannung und kann richtig Strom liefern — ein stabiler Mittelpunkt, die 0 V einer ±4,5-V-Versorgung.

**Vermittelt:** virtuelle Masse, geteilte Versorgung, invertierender Verstärker, Belastbarkeit

## Was zu tun ist

Klick auf **Sim**. Dreh den Eingangsknopf (potentiometer_7) von einem Ende zum anderen und beobachte die rote und die grüne LED und das Voltmeter (voltmeter_14). Schieb dann den Schiebeschalter (slide_switch_6) nach rechts — der Mittelpunkt kommt jetzt von zwei Widerständen — und dreh noch einmal.

## Was du sehen solltest

- Links: der Ausgang des Op-Amps ist der Eingang, am Mittelpunkt gespiegelt. Eingang unter der Mitte: Rot, und das Messgerät zeigt Plus; darüber: Grün, und es zeigt Minus. Der Mittelpunkt bleibt dabei bei 4,5 V.
- Rechts: der Mittelpunkt selbst wandert um mehr als zwei Volt, wenn die LEDs Strom ziehen, und die Spiegelung klappt nicht mehr.

## Warum es funktioniert

Die Endstufe des Verstärkers hält ihren Ausgang auf seinem inneren Halbspannungspunkt, egal wie viel Strom hinein- oder herausfließt. Zwei Widerstände halten ihren Mittelpunkt nur, solange niemand Strom entnimmt.
