---
level: advanced
age: 14+
prereqs: [pc05-npn-switch, lab-transistor-flip-flop]
teaches: [thyristor, latch, positive-feedback, holding-current]
---
## Was du siehst
Ein NPN- und ein PNP-Transistor, eine rote LED, ein Gate-Taster und ein Hauptschalter. Zusammen verhalten sich die beiden Transistoren wie ein Thyristor: ein Schalter, der eingeschaltet bleibt, sobald er gezündet wurde.

## Probier das
1. Klick auf **Sim**. Die LED ist dunkel.
2. Tippe auf den Gate-Taster. Die LED leuchtet.
3. Lass los und tippe noch einmal. Die LED bleibt einfach an: Das Gate kann nur einschalten.
4. Schalte den Hauptschalter aus und wieder ein. Jetzt bleibt die LED bis zum nächsten Gate-Impuls dunkel.

## Was passiert hier
Der Kollektor des NPN zieht Strom aus der Basis des PNP, und der Kollektor des PNP schiebt Strom in die Basis des NPN. Fließt erst einmal ein wenig Strom, hält jeder Transistor den anderen eingeschaltet: eine Schleife mit Mitkopplung. Der Gate-Impuls startet die Schleife nur. Danach hält der Strom durch die Last sie am Laufen, also kann man sie nur stoppen, indem man diesen Strom unterbricht. Echte Thyristoren sind genau so aufgebaut, als vier Siliziumschichten in einem Gehäuse, und schalten Lampen, Motoren und Blitzgeräte.

## Weiter geht's
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — zwei NPN in einer Schleife: ein Speicher mit zwei stabilen Zuständen.
- [lab-pnp-npn-relax](../lab-pnp-npn-relax) — dasselbe Paar, gezündet von einem Kondensator, wird zum Oszillator.
