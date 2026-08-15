---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [npn-transistor, switching, amplification]
---
## Was du siehst
Ein NPN-Transistor steuert eine LED. Ein kleiner Strom in die Basis schaltet einen viel größeren Strom durch den Kollektor, der die LED zum Leuchten bringt.

## Probier das
1. Klick auf **Sim** und beobachte den Zustand der LED.
2. Schau dir die Basisspannung an — sie liegt bei etwa 0,7 V, der Flussspannung der Basis-Emitter-Strecke.
3. Entferne den Basiswiderstand (setze ihn sehr hoch). Der Transistor sperrt und die LED geht aus.

## Was passiert hier
Ein NPN-Transistor hat drei Anschlüsse: Basis, Kollektor und Emitter. Ein kleiner Basisstrom (hier etwa 0,43 mA durch den 10-kΩ-Widerstand) steuert einen viel größeren Kollektorstrom (bis zu 5,96 mA durch den 470-Ω-Widerstand und die LED). Wenn genug Basisstrom fließt, geht der Transistor in Sättigung — er wirkt wie ein geschlossener Schalter zwischen Kollektor und Emitter, mit nur etwa 0,2 V Spannungsabfall. Die Stromverstärkung (Beta) von 100 bedeutet, dass der Kollektor das 100-Fache des Basisstroms führen kann.

## Warum das wichtig ist
Transistorschalten ist die Grundlage aller digitalen Elektronik. Jedes Logikgatter, jeder Prozessor und jeder Motortreiber nutzt Transistoren als elektronisch gesteuerte Schalter — große Ströme werden mit winzigen Steuersignalen ein- und ausgeschaltet.

## Weiter geht's
- [pc23-transistor-switch](../pc23-transistor-switch) — eine komplexere Transistor-Schaltung.
- [pc32-pnp-high-side](../pc32-pnp-high-side) — der komplementäre PNP-Transistor, der auf der High-Side schaltet.
- Experiment: Berechne den minimalen Basisstrom, um diesen Transistor in Sättigung zu bringen (Ic/Beta), und finde den Widerstandswert, der genau diesen Strom liefert.
