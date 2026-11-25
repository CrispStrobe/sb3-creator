# Sirene und Heulton am Steuereingang

Ein Ton, der auf und ab gleitet. Halte die Taste, und er steigt wie eine Sirene; lass los, und er fällt zurück. Oder lass einen zweiten, ganz langsamen Timer das erledigen: ein Heulton.

**Vermittelt:** Steuerspannung, spannungsgesteuerter Oszillator, RC-Rampe

## Was zu tun ist

Klick auf **Sim** und hör zu: links (HEULEN) lässt der Schiebeschalter (slide_switch_8) den Ton von selbst heulen. Schieb ihn nach rechts (SIRENE): halte die Taste (button_9) ein paar Sekunden und lass dann los.

## Was du sehen solltest

- HEULEN: Der Ton steigt und fällt etwa alle anderthalb Sekunden.
- SIRENE: Solange du die Taste hältst, steigt der Ton von etwa 840 Hz auf etwa 1370 Hz; lässt du los, gleitet er wieder hinunter.

## Warum es funktioniert

Der Tongenerator vergleicht die Spannung an seinem Zeitkondensator mit zwei Schaltspannungen, die sein Steuereingang festlegt. Ein großer Kondensator am Steuereingang zieht diese Schaltspannungen langsam hoch oder runter. Niedrigere Schaltspannungen sind schneller erreicht: ein höherer Ton. Die Taste entlädt den großen Kondensator über einen Widerstand, deshalb gleitet der Ton, statt zu springen.
