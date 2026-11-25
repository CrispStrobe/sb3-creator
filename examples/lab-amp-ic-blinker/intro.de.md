# Verstärker-Blinker: Ein LM386 lässt zwei LEDs blinken

Ein Audioverstärker kann LEDs blinken lassen. Ein Kondensator führt den Ausgang des Verstärkers an seinen eigenen Eingang zurück, und damit wird der Verstärker zu einem Oszillator, der langsam zwischen seinen beiden Grenzen hin- und herkippt. Eine rote LED leuchtet auf der hohen, eine grüne auf der tiefen Seite.

**Vermittelt:** Kippschwinger aus Verstärker und Kondensator, Blinkfrequenz durch C bestimmt, abwechselnde LEDs

## Was zu tun ist

Klick auf **Sim** und beobachte die beiden LEDs. Stell dann den Schiebeschalter auf den kleineren Kondensator.

## Was du sehen solltest

- Rot und Grün wechseln sich ab, etwa 1,6-mal pro Sekunde.
- Mit dem kleineren Kondensator blinkt es etwa doppelt so schnell.

## Warum es funktioniert

Jedes Mal, wenn der Ausgang springt, schiebt der Kondensator den Plus-Eingang des Verstärkers in dieselbe Richtung, und der Verstärker, der seinen Eingang mit 20 multipliziert, wird ganz auf diese Seite getrieben. Der Schub klingt langsam ab, während sich der Kondensator über den Widerstand auflädt. Ist er fast verschwunden, gibt der Verstärker nach und kippt zur anderen Seite, und das Spiel beginnt von vorn. Ein kleinerer Kondensator lädt sich schneller auf, deshalb blinkt es schneller.
