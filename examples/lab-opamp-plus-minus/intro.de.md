# Der Operationsverstärker an Plus-Minus-Spannung

Zwei Batterien liefern +9 V, 0 V und −9 V. Ein Komparator an einem Poti über die ganze Spannung lässt sich kaum ins Gleichgewicht bringen, und zwei gegeneinander geschaltete LEDs zeigen, wo die Leitung in jeder Richtung beginnt.

**Vermittelt:** symmetrische Versorgung, Leerlaufverstärkung, LED-Schwellen in beiden Polaritäten

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf INPUT (potentiometer_5) langsam durch die Mitte und beobachte die rote und die grüne LED des Komparators (led_8, led_9). Dann beobachte das Messgerät am zweiten LED-Paar (voltmeter_13), während du den Knopf ganz auf und ganz zu drehst.

## Was du sehen solltest

- Die LEDs des Komparators wechseln genau in der Mitte; keine Knopfstellung lässt beide dunkel.
- Das Messgerät am Paar folgt dem Eingangsmessgerät (voltmeter_14) bis etwa +1,7 V und bis etwa −2 V, dann bleibt es stehen; dort beginnt die rote bzw. grüne LED des Paars zu leuchten.

## Warum es funktioniert

Der Operationsverstärker verstärkt die Differenz seiner Eingänge etwa 100 000-fach; ein Millivolt reicht schon, um seinen Ausgang an ein Ende zu treiben. Der Spannungsfolger kopiert den Eingang genau; die LEDs führen keinen Strom, bis die Spannung über ihnen ihre Schwelle erreicht, und halten sie von da an fest.
