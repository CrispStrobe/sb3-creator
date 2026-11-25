---
level: intermediate
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, frequency, parallel-resistors, filter, sound]
---
## Was du siehst
Ein Transistor-Tongenerator, der ständig läuft, ein Taster **SIREN**, ein Schiebeschalter neben zwei Widerständen und ein Schalter **SOFT** mit einem Kondensator.

## Probier das
1. Klick auf **Sim**: ein gleichmäßiger Ton im Hörer.
2. Drück **SIREN** immer wieder kurz: Der Ton springt hoch und zurück, wie eine Sirene.
3. Stell den Schiebeschalter auf den anderen Widerstand und mach es noch einmal: Der obere Ton ist schriller.
4. Schließ **SOFT**: dieselben Töne, aber runder und weicher.

## Was passiert hier
Die Basis des ersten Transistors wird über 100 kΩ versorgt. **SIREN** schaltet einen zweiten Widerstand parallel; zwei Widerstände nebeneinander lassen mehr Strom durch als einer, der Zeitkondensator lädt schneller, der Ton steigt. Je kleiner der zusätzliche Widerstand (15 kΩ statt 47 kΩ), desto größer der Sprung. Der Hörer hängt am Emitter eines dritten Transistors, der die Spannung an seiner Basis weitergibt. **SOFT** legt dort einen Kondensator an: Er muss sich über 10 kΩ laden, aus den steilen Stufen werden Rampen, und ein Ton mit runden Kanten klingt sanfter.

## Weiter geht's
- [lab-npn-swell-siren](../lab-npn-swell-siren) — eine Sirene, die gleitet statt springt.
