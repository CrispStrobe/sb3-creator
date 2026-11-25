# Musik durch einen Lichtleiter, als Frequenz übertragen und mit einer PLL zurückgewonnen

Statt eine LED mit der Musik heller und dunkler zu machen, ändert diese Strecke, wie oft die LED blitzt: etwa 80.000-mal pro Sekunde, mit der Musik etwas schneller oder langsamer. Am anderen Ende folgt eine Phasenregelschleife (PLL) der Blitzrate, und die Spannung, die sie dafür braucht, ist wieder die Musik, für einen Verstärkerchip und einen Ohrhörer.

**Vermittelt:** Frequenzmodulation, ein spannungsgesteuerter Transistor-Multivibrator, Demodulation mit einer PLL

## Was zu tun ist

Klick auf **Sim**. Dreh die Amplitude des Musikgenerators auf 0 und wieder auf, und verstell das Poti, das die Mittenfrequenz einstellt.

## Was du sehen solltest

- Der Oszillator der PLL läuft in der Nähe der Senderate, 70–90 kHz.
- Mit Musik schwingt der Demodulatorausgang der PLL (Pin 10) mit der Musik; ohne Musik bleibt er ruhig.

## Warum es funktioniert

Der Operationsverstärker addiert die Musik zu einer festen Spannung vom Poti, und diese Spannung speist die Basiswiderstände eines Multivibrators aus zwei Transistoren: Eine höhere Spannung lädt seine Kondensatoren schneller, also blitzt er schneller. Der Fototransistor am Ende des Lichtleiters macht aus den Blitzen wieder Impulse. Der Phasenvergleicher des 4046 vergleicht sie mit seinem eigenen Oszillator und verschiebt die Steuerspannung, bis beide im Takt laufen. Um den Änderungen der Rate zu folgen, muss die Steuerspannung mit der Musik mitgehen, und der Chip gibt sie an seinem Demodulatorausgang aus. Weil nur die RATE die Musik trägt, wird sie bei schwächerem Licht (ein längerer Lichtleiter, eine staubige Kupplung) nicht leiser.
