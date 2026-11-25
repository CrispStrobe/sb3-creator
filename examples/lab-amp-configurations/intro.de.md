# Emitter-, Kollektor- und Basisschaltung nebeneinander

Ein Transistor hat drei Anschlüsse, und der, den Eingang und Ausgang gemeinsam haben, gibt der Schaltung ihren Namen. Hier geht dasselbe kleine Signal in alle drei Varianten; das Oszilloskop zeigt, was jede daraus macht.

**Vermittelt:** Grundschaltungen des Transistors, Spannungsverstärkung, Phasenlage, Eingangswiderstand

## Was zu tun ist

Klick auf **Sim** und öffne das Oszilloskop. Kanal 1 ist das Signal vom Generator. Mit den zwei Schiebeschaltern wählst du, was Kanal 2 zeigt: den Ausgang der Emitterschaltung, der Basisschaltung oder der Kollektorschaltung. Vergleich Größe und Richtung.

## Was du sehen solltest

- Emitterschaltung: viel größer und auf den Kopf gestellt.
- Kollektorschaltung: so groß wie der Eingang und im Gleichtakt.
- Basisschaltung: größer und im Gleichtakt mit dem Eingang.

## Warum es funktioniert

In der Emitterschaltung bewegt der Eingang die Basis gegen den Emitter, den der Kondensator festhält; der Kollektorstrom folgt, und sein Spannungsabfall an 4,7 kΩ ist groß und entgegengesetzt. Beim Emitterfolger folgt der Emitter einfach der Basis, 0,6 V tiefer. In der Basisschaltung wird die Basis festgehalten und das Signal schiebt den Emitter: eine ähnliche Änderung des Kollektorstroms, jetzt aber im Gleichtakt mit dem Eingang, und den Strom muss der Generator selbst liefern.
