# Gleichspannungsverstärkung des Verstärker-Chips

Ein paar Millivolt gehen hinein, ein Zeiger zeigt, was herauskommt. Schließ einen der vier Schalter an den Verstärkungs-Anschlüssen des Chips, und dieselbe Eingangsspannung bewegt den Zeiger weiter: je kleiner der Widerstand, desto höher die Verstärkung.

**Vermittelt:** Spannungsverstärkung, Verstärkungswiderstand, Verstärkung mit einem Messgerät bestimmen

## Was zu tun ist

Klick auf **Sim**. Lies die Eingangsspannung am Voltmeter (voltmeter_5) und die Ausgangsspannung am Zeigerinstrument (analog_meter_16) ab. Schließ jeweils einen Schalter (switch_7: 1 kΩ, switch_9: 220 Ω, switch_11: 47 Ω, switch_13: eine Drahtbrücke) und teile die Anzeige durch die Eingangsspannung. Dreh den EINGANG-Knopf (potentiometer_4) auf null und wieder zurück.

## Was du sehen solltest

- Eingang etwa 9,5 mV; Zeiger etwa 0,19 V, wenn alle Schalter offen sind: Verstärkung 20.
- Etwa 0,38 V mit 1 kΩ, 0,82 V mit 220 Ω, 1,44 V mit 47 Ω und 1,89 V mit der Drahtbrücke: Verstärkungen von etwa 40, 86, 151 und 198.
- Steht der Knopf auf null, zeigt das Instrument null.

## Warum es funktioniert

Im Chip entscheidet ein Widerstandsnetz zwischen Ausgang und Verstärkungs-Anschlüssen, wie viel vom Ausgang zurückgeführt wird. Ein Widerstand zwischen Pin 1 und Pin 8 verkleinert den unteren Teil dieses Netzes, also wird weniger zurückgeführt und die Verstärkung steigt, bei direkter Verbindung bis 200. Das Instrument hängt an einem Punkt mit halber Betriebsspannung, weil der Ausgang ohne Eingangssignal auf halber Betriebsspannung ruht.
