# Was das Fenster eines Schmitt-Triggers bestimmt

Ein Schmitt-Trigger schaltet bei einer Spannung ein und bei einer niedrigeren aus. Das Verhältnis zweier Widerstände legt den Abstand fest — und eine hochohmige Quelle schmuggelt ihren eigenen Widerstand in dieses Verhältnis, wenn kein Puffer ihn heraushält.

**Vermittelt:** Hysterese, Rückkopplungsverhältnis, Quellwiderstand, Pufferstufe

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf INPUT (potentiometer_3) langsam auf, bis die rote LED (led_13) leuchtet, dann zurück, bis sie ausgeht, und merk dir beide Anzeigen von voltmeter_14. Wiederhol das mit WIDTH (slide_switch_7) rechts, dann beides noch einmal mit BUFFER (slide_switch_5) links.

## Was du sehen solltest

- Mit Puffer: ein Fenster von etwa 1,5 V mit 47 kΩ, etwa 4,8 V mit 15 kΩ.
- Ohne Puffer ist das Fenster viel breiter (etwa 5 V und 7,6 V): fast der ganze Ausgangshub.

## Warum es funktioniert

Der Ausgang zieht über den Rückkopplungswiderstand seinen eigenen +-Eingang hoch oder herunter; der Eingang muss deshalb weiter laufen, um das aufzuheben. Der Abstand ist der Ausgangshub mal Eingangswiderstand durch Rückkopplungswiderstand. Der Widerstand des Potis liegt in Reihe mit dem Eingangswiderstand; ohne Spannungsfolger lässt er ihn größer erscheinen.
