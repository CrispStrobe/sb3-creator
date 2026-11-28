# Eine Temperatur als Pulsrate gesendet und von einer PLL gelesen

Dieselbe Temperaturstufe bestimmt jetzt, wie oft ein Oszillator aus zwei Transistoren eine LED blitzen lässt: etwa 900-mal pro Sekunde, schneller, wenn es wärmer ist. Am anderen Ende des Lichtleiters rastet eine Phasenregelschleife auf die Blitze ein, und die Spannung, die sie im Takt hält, zeigt ein Messgerät: ein Thermometer am Ende eines Lichtleiters.

**Vermittelt:** Pulsraten- (Frequenz-)Kodierung eines Messwerts, eine PLL als Frequenz-Spannungs-Wandler

## Was zu tun ist

Klick auf **Sim**. Stell die Umgebung des PTC auf 25 °C und dann auf 45 °C und vergleiche die Anzeigen. Zieh das Ende des Lichtleiters ein wenig zurück: Die Anzeige bleibt.

## Was du sehen solltest

- 25 °C: Der Oszillator der PLL läuft bei etwa 900 Hz; das Messgerät zeigt etwa 3 V.
- 45 °C: schnellere Blitze (etwa 1050 Hz), der Oszillator folgt, und das Messgerät zeigt etwa 3,8 V.

## Warum es funktioniert

Der Ausgang des LM386 speist die Basiswiderstände des Multivibrators, ein wärmerer Fühler lädt seine Kondensatoren also schneller. Der 4046 vergleicht die ankommenden Impulse mit seinem eigenen Oszillator und verschiebt seine Steuerspannung, bis beide gleich schnell laufen; diese Spannung, an den Demodulatorausgang kopiert, steigt mit der Rate und damit mit der Temperatur. Weil nur die Rate den Wert trägt, ändert schwächeres Licht ihn nicht, solange die Impulse noch ankommen.
