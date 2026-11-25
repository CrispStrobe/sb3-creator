# Basisschaltung: Der Emitter ist der Eingang

Die dritte Art, einen Transistor zu schalten. Seine Basis wird von einem Teiler und einem Kondensator festgehalten, das Signal geht in den Emitter, und der Ausgang wird am Kollektor abgenommen. Ein Taster zieht den Emitter herunter; ein Generator speist einen kleinen Ton ein.

**Vermittelt:** Basisschaltung, gleichphasige Verstärkung, kleiner Eingangswiderstand

## Was zu tun ist

Klick auf **Sim** und warte einen Moment, bis der Basiskondensator geladen ist. Halte den **Taster** gedrückt und lass ihn wieder los. Beobachte beide Oszilloskopkanäle: Kanal 1 ist der Emitter, Kanal 2 der Kollektor.

## Was du sehen solltest

- Der Tastendruck zieht den Emitter etwas herunter (von etwa 2,04 V auf 1,96 V); der Kollektor fällt ebenfalls (von etwa 7,2 V auf 6,5 V), und die LED wird heller: Eingang und Ausgang bewegen sich in dieselbe Richtung.
- Der Ton des Generators erscheint am Kollektor etwa neunmal größer und nicht umgedreht.

## Warum es funktioniert

Bei festgehaltener Basis erhöht ein tieferer Emitter die Basis-Emitter-Spannung, also fließt mehr Strom durch den Transistor — und durch den Kollektorwiderstand, an dem mehr Spannung abfällt. Die kleine Änderung am Emitter wird am Kollektor zu einer großen, in derselben Richtung. Der Emitter ist ein niederohmiger Eingang; deshalb verwendet man diese Stufe dort, wo eine Quelle wenig belastet werden darf, etwa bei Hochfrequenz.
