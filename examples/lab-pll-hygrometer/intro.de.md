# Feuchte hörbar gemacht, und eine Hygrometer-Brücke

Ein Kamm aus Kupferbahnen unter einem dünnen Salzfilm ist ein Feuchtesensor: Je feuchter die Luft, desto besser leitet er. Hier bestimmt er die Tonhöhe des Oszillators in einem PLL-Baustein, so dass du die Feuchte hören kannst; leg einen Schalter um, und derselbe Sensor bewegt stattdessen ein Messgerät.

**Vermittelt:** Feuchtemessung über den Widerstand, der spannungsgesteuerte Oszillator, Brücken

## Was zu tun ist

Klick auf **Sim**. Nimm den Feuchteregler des Kamms: trockener Raum, normaler Raum, Atem. Stell dann den Schiebeschalter auf die Messgeräte-Seite und mach dasselbe.

## Was du sehen solltest

- Ton: bei 50 % fast nichts, bei 60 % etwa 340 Hz, bei 66 % etwa 1 kHz: Anhauchen lässt den Ton hochschießen.
- Messgerät: unter null bei trockener Luft, null bei etwa 62 %, über null bei feuchter Luft.

## Warum es funktioniert

Trockenes Salz leitet nicht. In feuchter Luft nimmt der Film etwas Wasser auf, die Ionen des Salzes werden beweglich, und der Widerstand sinkt steil. In der Ton-Stellung bestimmt der Kamm, wie viel Strom den Kondensator des Oszillators lädt: weniger Widerstand, mehr Strom, höherer Ton. In der Messgeräte-Stellung ist er ein Zweig einer Brücke, und das Messgerät zeigt, nach welcher Seite sie verstimmt ist.
