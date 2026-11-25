# Besetztzeichen-Pieptöne

Das Besetztzeichen eines Telefons ist ein Ton, der ganz ein- und ausgeschaltet wird: Piep, Pause, Piep. Hier blinken zwei Transistoren langsam, und solange der erste leitet, hält eine Diode den Zeitkondensator des Leistungsverstärkers fest, sodass sein Ton aussetzt. Die grüne LED leuchtet bei jedem Piep.

**Vermittelt:** ein Oszillator wird getastet, eine Diodenklemme, ein langsamer Oszillator steuert einen schnellen

## Was zu tun ist

Klick auf **Sim**, hör zu und beobachte die grüne LED.

## Was du sehen solltest

- Pieptöne von etwa 690 Hz, jeder etwa 0,3 s lang, mit gleich langen Pausen.
- Die grüne LED leuchtet bei jedem Piep und ist in den Pausen dunkel.

## Warum es funktioniert

Der Tonoszillator braucht einen Kondensator, der zwischen zwei Schaltpunkten hin- und herpendelt. Solange der erste Transistor leitet, liegt sein Kollektor fast bei 0 V, und die Diode hält den Kondensator bei etwa 0,7 V fest: Er erreicht den oberen Schaltpunkt nie, und der Oszillator steht. Sperrt der Transistor, lässt die Diode los, und der Ton läuft.
