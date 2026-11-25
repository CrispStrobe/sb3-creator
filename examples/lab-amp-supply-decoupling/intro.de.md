# Heulen und Brummen über die Versorgung

Bei hoher Verstärkung hört ein Verstärker seine eigene Versorgung. Mit einer schwachen Batterie fängt er von selbst an zu heulen, an einem ungesiebten Netzteil brummt er. Ein Widerstand und ein großer Kondensator an der richtigen Stelle heilen beides.

**Vermittelt:** Innenwiderstand der Versorgung, Rückkopplung über die Versorgung, Brumm, Entkopplung

## Was zu tun ist

Klick auf **Sim**. Hör zu, solange alle drei Schiebeschalter links stehen. Schieb SCHWACH (slide_switch_5) nach rechts: eine schwache Batterie. Schieb dann ENTKOPPELN (slide_switch_7) nach rechts. Stell SCHWACH zurück, schieb VERSORGUNG (slide_switch_4) nach rechts für das Netzteil und probier ENTKOPPELN noch einmal.

## Was du sehen solltest

- Frische Batterie: Stille.
- Schwache Batterie: ein lautes Heulen von etwa 120 Hz; die Spannung am Chip springt um mehrere Volt auf und ab.
- Schwache Batterie mit ENTKOPPELN: wieder Stille.
- Netzteil: ein lautes Brummen mit 100 Hz. Netzteil mit ENTKOPPELN: nur noch ein leises Brummen.

## Warum es funktioniert

Der Eingang des Verstärkers wird aus derselben Versorgung gespeist wie seine Endstufe. Schiebt der Ausgang Strom in den Lautsprecher, bricht die Spannung einer schwachen Batterie ein, der Einbruch erreicht den Eingang, und der Verstärker macht ihn 200-mal größer: Die Schaltung treibt sich selbst an. Die Welligkeit des Netzteils nimmt denselben Weg. ENTKOPPELN speist den Eingang über 10 kΩ mit einem 470-µF-Kondensator, der alles glättet, was schneller ist als ein langsames Driften.
