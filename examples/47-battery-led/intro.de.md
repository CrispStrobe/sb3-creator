---
level: beginner
age: 8+
prereqs: []
teaches: [battery, portable-circuit, voltage-matching]
---
## Was du siehst
Die einfachste tragbare Schaltung: eine Batterie (Knopfzelle oder AA), ein Widerstand und eine LED. Kein Steckbrett, kein MCU — nur drei Bauteile, die in eine Handflaeche passen. Die LED leuchtet, solange die Batterie Ladung hat.

## Probier das
1. Starte die Simulation und bestaetie, dass die LED allein von der Batterie leuchtet.
2. Aendere die Batteriespannung (z.B. 3 V Knopfzelle vs. 1,5 V AA) und beobachte, ob die LED noch leuchtet — eine 1,5-V-Batterie kann fuer manche LEDs zu niedrig sein.
3. Entferne den Widerstand und beachte den Stromstoss — auch mit einer kleinen Batterie braucht die LED Schutz.

## Was passiert hier
Eine Batterie liefert eine feste Spannung, die beim Entladen sinkt. Der Widerstand begrenzt den Strom auf ein sicheres Mass fuer die LED, genau wie bei einer netzgespeisten Schaltung. Der wesentliche Unterschied ist, dass eine Batterie begrenzte Energie hat — eine CR2032-Knopfzelle speichert etwa 220 mAh, bei 20 mA ist sie also in rund 11 Stunden leer. Die Batteriespannung auf die Flussspannung der LED abzustimmen ist wichtig: eine einzelne 1,5-V-AA-Zelle kann die meisten LEDs nicht in Durchlassrichtung betreiben (die etwa 2 V brauchen), aber eine 3-V-Knopfzelle schon.

## Warum das wichtig ist
Batteriebetriebene Schaltungen sind der Ausgangspunkt fuer tragbare Projekte — Wearables, Sensoren, Spielzeug. Spannungsabstimmung und Strombudgetierung zu verstehen entscheidet, ob dein Projekt Stunden oder Minuten laeuft.

## Weiter geht's
- [21-resistor-led](../21-resistor-led) — die gleiche Schaltung mit einem Labornetzteil statt Batterie.
- [01-blink](../01-blink) — fuege einen Mikrocontroller hinzu, um die LED blinken zu lassen und Batterie zu sparen, indem sie die Haelfte der Zeit aus ist.
- Experiment: Berechne, wie lange eine CR2032 (220 mAh, 3 V) eine LED bei 10 mA versorgen kann, und wie viel laenger bei 5 mA mit einem groesseren Widerstand.
