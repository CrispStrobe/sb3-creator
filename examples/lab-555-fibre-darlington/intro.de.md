# Lichtleiter auf einen Foto-Darlington

Licht läuft durch eine Faser; an ihrem Ende machen ein Fototransistor und ein zweiter Transistor, zusammen ein Foto-Darlington, daraus einen großen Strom. Bring das Faserende näher, und ein 555 schaltet um – oder sein Ton steigt.

**Vermittelt:** Darlington-Verstärkung, optische Abtastung, 555 als Schalter und als Oszillator

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf des Lichtleiters (light_path_23) langsam von 10 mm auf 0 und zurück: achte auf die rote LED FERN und die grüne LED NAH. Schieb dann den Schiebeschalter (slide_switch_8) nach rechts (TON) und dreh noch einmal, während du zuhörst.

## Was du sehen solltest

- SCHALTEN: FERN ab 4 mm und mehr, NAH ab 2 mm und weniger.
- TON: etwa 2,1 kHz mit fernem Faserende, steigt auf etwa 3,4 kHz, wenn es nahe kommt.

## Warum es funktioniert

Je kleiner der Spalt zwischen Faser und Fototransistor, desto mehr Licht kommt an und desto mehr Strom lässt er durch. Dieser Strom allein ist winzig; er fließt in die Basis eines zweiten Transistors, der etwa hundertmal mehr durchlässt. Links erzeugt dieser Strom eine Spannung an einem Widerstand, und der 555 schaltet, wenn sie seine Schwellen überschreitet. Rechts hilft er, den Zeitkondensator des 555 zu laden: Jede Schwingung wird kürzer und der Ton höher.
